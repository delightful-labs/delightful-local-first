import { assign, fromCallback, fromPromise, sendTo, setup, stateIn, stopChild } from 'xstate'
import type { ActorRef, Snapshot } from 'xstate'
import type {
	SessionObservationFailure,
	SessionReadinessCapability,
	SessionReadinessReport,
	SessionReadinessScope,
	SessionStatus
} from '../../contracts/session.js'

export type SessionReadinessInput = Readonly<{
	reportTo: ActorRef<Snapshot<unknown>, SessionReadinessReport>
}>
export type SessionReadinessEvent =
	| Readonly<{
			type: 'BIND'
			scope: SessionReadinessScope
			capability: SessionReadinessCapability
	  }>
	| Readonly<{ type: 'RETRY'; scope: SessionReadinessScope; attempt: number }>
	| Readonly<{ type: 'REOBSERVE'; scope: SessionReadinessScope; observation: number }>
	| Readonly<{ type: 'SHUTDOWN' }>
type ObservationEvent =
	| {
			type: 'OBSERVED'
			scope: SessionReadinessScope
			observation: number
			status: SessionStatus
			afterRetry: number | undefined
	  }
	| {
			type: 'OBSERVATION_FAILED'
			scope: SessionReadinessScope
			observation: number
			reason: SessionObservationFailure
	  }
type Event =
	| SessionReadinessEvent
	| ObservationEvent
	| { type: 'xstate.error.actor.observer'; actorId: string; error: unknown }
type Context = {
	reportTo: SessionReadinessInput['reportTo']
	scope: SessionReadinessScope | undefined
	capability: SessionReadinessCapability | undefined
	observation: number
	attempt: number
}
type ObserverInput = {
	scope: SessionReadinessScope
	capability: SessionReadinessCapability
	observation: number
	reportTo: SessionReadinessInput['reportTo']
}
function required<Value>(value: Value | undefined): Value {
	if (value === undefined) throw new Error('Session readiness binding unavailable')
	return value
}
function sameScope(left: SessionReadinessScope, right: SessionReadinessScope | undefined) {
	return left.binding === right?.binding && left.attachment === right.attachment
}
function fresh(value: number, previous: number) {
	return Number.isSafeInteger(value) && value > previous
}

const actors = {
	observe: fromCallback<{ type: 'REFRESH'; attempt: number }, ObserverInput>(
		({ input, sendBack, receive }) => {
			// Resource-boundary guards only; workflow phases remain in the machine below.
			let active = true
			const publish = (afterRetry: number | undefined) => {
				if (!active) return
				try {
					const status = input.capability.readStatus()
					sendBack({
						type: 'OBSERVED',
						scope: input.scope,
						observation: input.observation,
						status,
						afterRetry
					})
				} catch {
					active = false
					sendBack({
						type: 'OBSERVATION_FAILED',
						scope: input.scope,
						observation: input.observation,
						reason: 'readFailed'
					})
				}
			}
			receive((event) => publish(event.attempt))
			let unsubscribe: (() => void) | undefined
			try {
				unsubscribe = input.capability.subscribe(() => publish(undefined))
			} catch {
				active = false
				sendBack({
					type: 'OBSERVATION_FAILED',
					scope: input.scope,
					observation: input.observation,
					reason: 'subscribeFailed'
				})
			}
			publish(undefined)
			return () => {
				active = false
				try {
					unsubscribe?.()
				} catch {
					input.reportTo.send({
						type: 'SESSION_OBSERVATION_CLEANUP_FAILED',
						scope: input.scope,
						observation: input.observation
					})
				}
			}
		}
	),
	retry: fromPromise(({ input }: { input: SessionReadinessCapability }) => input.retry())
}

/** Host authorizes RETRY only after its workspace drain and mutual exclusion with restoration. */
export function createSessionReadinessMachine() {
	const model = setup<
		Context,
		Event,
		typeof actors,
		{},
		{
			publishStatus: undefined
			publishObservationFailure: undefined
			publishObserverCrash: undefined
			retryStarted: undefined
			retryResolved: undefined
			retryRejected: undefined
		},
		{
			currentObservation: undefined
			freshRetry: undefined
			freshObservation: undefined
			closingRetry: undefined
			failedRetryObserver: undefined
			refreshed: undefined
		},
		never,
		string,
		SessionReadinessInput,
		{ outcome: 'closed' }
	>({
		actors,
		guards: {
			currentObservation: ({ context, event }) =>
				(event.type === 'OBSERVED' || event.type === 'OBSERVATION_FAILED') &&
				sameScope(event.scope, context.scope) &&
				event.observation === context.observation,
			freshRetry: ({ context, event }) =>
				event.type === 'RETRY' &&
				sameScope(event.scope, context.scope) &&
				fresh(event.attempt, context.attempt),
			freshObservation: ({ context, event }) =>
				event.type === 'REOBSERVE' &&
				sameScope(event.scope, context.scope) &&
				fresh(event.observation, context.observation),
			closingRetry: stateIn({ bound: { retrying: 'closing' } }),
			failedRetryObserver: stateIn({ bound: { retrying: 'observerFailed' } }),
			refreshed: ({ context, event }) =>
				event.type === 'OBSERVED' &&
				sameScope(event.scope, context.scope) &&
				event.observation === context.observation &&
				event.afterRetry === context.attempt
		},
		actions: {
			publishStatus: sendTo(
				({ context }) => context.reportTo,
				({ context, event }): SessionReadinessReport => {
					if (event.type !== 'OBSERVED') throw new Error('Missing observation')
					return {
						type: 'SESSION_STATUS',
						scope: required(context.scope),
						observation: event.observation,
						status: event.status,
						afterRetry: event.afterRetry
					}
				}
			),
			publishObservationFailure: sendTo(
				({ context }) => context.reportTo,
				({ context, event }): SessionReadinessReport => ({
					type: 'SESSION_OBSERVATION_FAILED',
					scope: required(context.scope),
					observation: context.observation,
					reason: event.type === 'OBSERVATION_FAILED' ? event.reason : 'observerFailed'
				})
			),
			publishObserverCrash: sendTo(
				({ context }) => context.reportTo,
				({ context }): SessionReadinessReport => ({
					type: 'SESSION_OBSERVATION_FAILED',
					scope: required(context.scope),
					observation: context.observation,
					reason: 'observerFailed'
				})
			),
			retryStarted: sendTo(
				({ context }) => context.reportTo,
				({ context }): SessionReadinessReport => ({
					type: 'SESSION_RETRY_STARTED',
					scope: required(context.scope),
					attempt: context.attempt
				})
			),
			retryResolved: sendTo(
				({ context }) => context.reportTo,
				({ context }): SessionReadinessReport => ({
					type: 'SESSION_RETRY_SETTLED',
					scope: required(context.scope),
					attempt: context.attempt,
					outcome: 'resolved'
				})
			),
			retryRejected: sendTo(
				({ context }) => context.reportTo,
				({ context }): SessionReadinessReport => ({
					type: 'SESSION_RETRY_SETTLED',
					scope: required(context.scope),
					attempt: context.attempt,
					outcome: 'rejected'
				})
			)
		}
	})
	const retryCommands = model.createStateConfig({
		on: {
			RETRY: {
				guard: 'freshRetry',
				target: 'retrying',
				actions: assign(({ event }) => ({ attempt: event.attempt }))
			}
		}
	})
	return model.createMachine({
		id: 'session-readiness',
		initial: 'waiting',
		context: ({ input }) => ({
			reportTo: input.reportTo,
			scope: undefined,
			capability: undefined,
			observation: 0,
			attempt: 0
		}),
		output: () => ({ outcome: 'closed' }),
		states: {
			waiting: {
				on: {
					BIND: {
						target: 'bound',
						actions: assign(({ event }) => ({
							scope: { ...event.scope },
							capability: event.capability
						}))
					},
					SHUTDOWN: 'closed'
				}
			},
			bound: {
				initial: 'observing',
				invoke: {
					id: 'observer',
					src: 'observe',
					input: ({ context }) => ({
						scope: required(context.scope),
						capability: required(context.capability),
						observation: context.observation,
						reportTo: context.reportTo
					}),
					onError: { target: '.observerFailed', actions: 'publishObserverCrash' }
				},
				on: {
					OBSERVED: { guard: 'currentObservation', actions: 'publishStatus' },
					OBSERVATION_FAILED: {
						guard: 'currentObservation',
						target: '.observerFailed',
						actions: 'publishObservationFailure'
					},
					SHUTDOWN: '#session-readiness.closed'
				},
				states: {
					observing: retryCommands,
					retryFailed: retryCommands,
					observerFailed: {
						entry: stopChild('observer'),
						on: {
							OBSERVED: {},
							OBSERVATION_FAILED: {},
							REOBSERVE: {
								guard: 'freshObservation',
								target: '#session-readiness.bound',
								reenter: true,
								actions: assign(({ event }) => ({ observation: event.observation }))
							}
						}
					},
					refreshing: {
						entry: sendTo('observer', ({ context }) => ({
							type: 'REFRESH',
							attempt: context.attempt
						})),
						on: {
							OBSERVED: [{ guard: 'refreshed', target: 'observing', actions: 'publishStatus' }, {}]
						}
					},
					retrying: {
						initial: 'active',
						entry: 'retryStarted',
						invoke: {
							src: 'retry',
							input: ({ context }) => required(context.capability),
							onDone: [
								{
									guard: 'closingRetry',
									target: '#session-readiness.closed',
									actions: 'retryResolved'
								},
								{
									guard: 'failedRetryObserver',
									target: '#session-readiness.bound.observerFailed',
									actions: 'retryResolved'
								},
								{ target: '#session-readiness.bound.refreshing', actions: 'retryResolved' }
							],
							onError: [
								{
									guard: 'closingRetry',
									target: '#session-readiness.closed',
									actions: 'retryRejected'
								},
								{
									guard: 'failedRetryObserver',
									target: '#session-readiness.bound.observerFailed',
									actions: 'retryRejected'
								},
								{ target: '#session-readiness.bound.retryFailed', actions: 'retryRejected' }
							]
						},
						on: {
							RETRY: {},
							REOBSERVE: {},
							OBSERVATION_FAILED: {
								guard: 'currentObservation',
								target: '.observerFailed',
								actions: 'publishObservationFailure'
							},
							'xstate.error.actor.observer': {
								target: '.observerFailed',
								actions: 'publishObserverCrash'
							},
							SHUTDOWN: '.closing'
						},
						states: {
							active: {},
							observerFailed: {
								entry: stopChild('observer'),
								on: { OBSERVED: {}, OBSERVATION_FAILED: {}, 'xstate.error.actor.observer': {} }
							},
							closing: {
								entry: stopChild('observer'),
								on: {
									SHUTDOWN: {},
									OBSERVED: {},
									OBSERVATION_FAILED: {},
									'xstate.error.actor.observer': {}
								}
							}
						}
					}
				}
			},
			closed: { type: 'final', entry: assign({ capability: undefined, scope: undefined }) }
		}
	})
}
