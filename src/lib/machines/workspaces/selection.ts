import { and, assign, sendTo, setup, stateIn } from 'xstate'
import type { ActorRef, Snapshot, SnapshotFrom } from 'xstate'
import type {
	WorkspaceDrainRequest,
	WorkspaceLease,
	WorkspaceSelectionEvent,
	WorkspaceSelectionObservation,
	WorkspaceSelectionOutput,
	WorkspaceSelectionReport,
	WorkspaceSelectionRequest,
	WorkspaceSelectionScope
} from '../../contracts/workspace-selection.js'

export type WorkspaceSelectionInput = Readonly<{
	reportTo: ActorRef<Snapshot<unknown>, WorkspaceSelectionReport>
}>
type Context = {
	reportTo: WorkspaceSelectionInput['reportTo']
	scope: WorkspaceSelectionScope | undefined
	request: WorkspaceSelectionRequest | undefined
	observation: WorkspaceSelectionObservation | undefined
	lease: WorkspaceLease | undefined
	drain: WorkspaceDrainRequest | undefined
	epoch: number
}
function required<Value>(value: Value | undefined): Value {
	if (value === undefined) throw new Error('Workspace selection binding unavailable')
	return value
}
function sameScope(left: WorkspaceSelectionScope, right: WorkspaceSelectionScope | undefined) {
	return left.binding === right?.binding && left.attachment === right.attachment
}
function sameRequest(
	left: WorkspaceSelectionRequest,
	right: WorkspaceSelectionRequest | undefined
) {
	return left.workspaceId === right?.workspaceId && left.attempt === right.attempt
}
function observationFrom(event: WorkspaceSelectionEvent) {
	return event.type === 'OBSERVED' || event.type === 'RESUME' || event.type === 'RETRY'
		? event.observation
		: undefined
}

/** Host owns all resources and acknowledges drain; this actor owns only scoped selection decisions. */
export function createWorkspaceSelectionMachine() {
	const model = setup<
		Context,
		WorkspaceSelectionEvent,
		{},
		{},
		{
			selectRequest: undefined
			observe: undefined
			reportSelected: undefined
			invalidate: undefined
			requestDrain: undefined
			reportDrainFailure: undefined
			clearReleased: undefined
		},
		{
			freshSelection: undefined
			freshObservation: undefined
			currentScope: undefined
			matchingDrain: undefined
			unresolvedDrain: undefined
			closing: undefined
			suspending: undefined
			locallyAllowed: undefined
			canActivate: undefined
		},
		never,
		string,
		WorkspaceSelectionInput,
		WorkspaceSelectionOutput
	>({
		guards: {
			currentScope: ({ context, event }) =>
				(event.type === 'SELECT' || event.type === 'SUSPEND') &&
				sameScope(event.scope, context.scope),
			freshSelection: ({ context, event }) =>
				event.type === 'SELECT' &&
				sameScope(event.scope, context.scope) &&
				event.request.workspaceId.trim().length > 0 &&
				Number.isSafeInteger(event.request.attempt) &&
				event.request.attempt > (context.request?.attempt ?? 0),
			freshObservation: ({ context, event }) => {
				const value = observationFrom(event)
				return (
					value !== undefined &&
					sameScope(value.scope, context.scope) &&
					sameRequest(value.request, context.request) &&
					Number.isSafeInteger(value.generation) &&
					value.generation >= 0 &&
					value.generation > (context.observation?.generation ?? -1)
				)
			},
			matchingDrain: ({ context, event }) =>
				(event.type === 'DRAINED' || event.type === 'DRAIN_FAILED') &&
				event.drain.token === context.drain?.token &&
				sameScope(event.drain.lease.scope, context.scope) &&
				event.drain.lease.epoch === context.drain.lease.epoch &&
				sameRequest(event.drain.lease.request, context.drain.lease.request),
			unresolvedDrain: ({ event }) =>
				event.type === 'DRAIN_FAILED' && event.outcome === 'unresolved',
			closing: stateIn({ bound: { draining: 'closing' } }),
			suspending: stateIn({ bound: { draining: 'suspending' } }),
			locallyAllowed: ({ context }) =>
				context.request !== undefined &&
				context.observation !== undefined &&
				sameRequest(context.observation.request, context.request) &&
				context.observation.access === 'allowed',
			canActivate: ({ context }) => context.epoch < Number.MAX_SAFE_INTEGER
		},
		actions: {
			selectRequest: assign(({ event }) => {
				if (event.type !== 'SELECT') throw new Error('Missing workspace selection intent')
				return { request: { ...event.request }, observation: undefined }
			}),
			observe: assign(({ event }) => {
				const value = required(observationFrom(event))
				return {
					observation: { ...value, scope: { ...value.scope }, request: { ...value.request } }
				}
			}),
			reportSelected: sendTo(
				({ context }) => context.reportTo,
				({ context }): WorkspaceSelectionReport => ({
					type: 'WORKSPACE_SELECTION',
					status: 'selected',
					lease: required(context.lease),
					directory: required(context.observation).directory
				})
			),
			invalidate: sendTo(
				({ context }) => context.reportTo,
				({ context }): WorkspaceSelectionReport => ({
					type: 'WORKSPACE_SCOPE_INVALIDATED',
					lease: required(context.lease)
				})
			),
			requestDrain: sendTo(
				({ context }) => context.reportTo,
				({ context }): WorkspaceSelectionReport => ({
					type: 'WORKSPACE_DRAIN_REQUESTED',
					drain: required(context.drain)
				})
			),
			reportDrainFailure: sendTo(
				({ context }) => context.reportTo,
				({ context, event }): WorkspaceSelectionReport => {
					if (event.type !== 'DRAIN_FAILED') throw new Error('Missing workspace drain failure')
					return {
						type: 'WORKSPACE_DRAIN_FAILED',
						drain: required(context.drain),
						outcome: event.outcome
					}
				}
			),
			clearReleased: assign({ lease: undefined, drain: undefined })
		}
	})
	const report = (
		status: 'waiting' | 'denied' | 'unavailable' | 'failed' | 'suspended' | 'drainFailed'
	) =>
		model.sendTo(
			({ context }) => context.reportTo,
			({ context }): WorkspaceSelectionReport => ({
				type: 'WORKSPACE_SELECTION',
				scope: required(context.scope),
				request: context.request,
				status,
				directory: context.observation?.directory
			})
		)
	const select = model.createStateConfig({
		on: {
			SELECT: { guard: 'freshSelection', target: '.assessing', actions: 'selectRequest' },
			OBSERVED: { guard: 'freshObservation', target: '.assessing', actions: 'observe' },
			SUSPEND: { guard: 'currentScope', target: '.suspended' },
			SHUTDOWN: '#workspace-selection.closed'
		}
	})
	const retainedFacts = model.createStateConfig({
		on: {
			SELECT: { guard: 'freshSelection', actions: 'selectRequest' },
			OBSERVED: { guard: 'freshObservation', actions: 'observe' }
		}
	})
	return model.createMachine({
		id: 'workspace-selection',
		initial: 'unbound',
		context: ({ input }) => ({
			reportTo: input.reportTo,
			scope: undefined,
			request: undefined,
			observation: undefined,
			lease: undefined,
			drain: undefined,
			epoch: 0
		}),
		output: ({ context }) =>
			context.drain ? { outcome: 'unresolved', drain: context.drain } : { outcome: 'closed' },
		states: {
			unbound: {
				on: {
					BIND: {
						target: 'bound',
						actions: assign(({ event }) => ({ scope: { ...event.scope } }))
					},
					SHUTDOWN: 'closed'
				}
			},
			bound: {
				...select,
				initial: 'assessing',
				states: {
					assessing: {
						always: [
							{
								guard: ({ context }) =>
									!context.request ||
									!context.observation ||
									context.observation.access === 'unknown',
								target: 'waiting'
							},
							{
								guard: ({ context }) => context.observation?.access === 'denied',
								target: 'denied'
							},
							{
								guard: ({ context }) => context.observation?.access === 'unavailable',
								target: 'unavailable'
							},
							{
								guard: ({ context }) => context.observation?.access === 'failed',
								target: 'failed'
							},
							{ guard: and(['locallyAllowed', 'canActivate']), target: 'selected' },
							{ target: 'failed' }
						]
					},
					waiting: { entry: report('waiting') },
					denied: { entry: report('denied') },
					unavailable: { entry: report('unavailable') },
					failed: { entry: report('failed') },
					selected: {
						entry: [
							assign(({ context }) => ({
								epoch: context.epoch + 1,
								lease: {
									scope: required(context.scope),
									request: required(context.request),
									epoch: context.epoch + 1
								}
							})),
							'reportSelected'
						],
						always: {
							guard: ({ context }) => context.observation?.access !== 'allowed',
							target: 'draining'
						},
						on: {
							SELECT: { guard: 'freshSelection', target: 'draining', actions: 'selectRequest' },
							OBSERVED: [
								{
									guard: and([
										'freshObservation',
										({ event }) => event.observation.access === 'allowed'
									]),
									actions: ['observe', 'reportSelected']
								},
								{ guard: 'freshObservation', actions: 'observe' }
							],
							SUSPEND: { guard: 'currentScope', target: 'draining.suspending' },
							SHUTDOWN: 'draining.closing'
						}
					},
					suspended: {
						entry: report('suspended'),
						on: {
							...retainedFacts.on,
							SUSPEND: {},
							RESUME: { guard: 'freshObservation', target: 'assessing', actions: 'observe' }
						}
					},
					drainFailed: {
						entry: report('drainFailed'),
						on: {
							...retainedFacts.on,
							SUSPEND: {},
							RETRY: { guard: 'freshObservation', target: 'assessing', actions: 'observe' }
						}
					},
					draining: {
						initial: 'switching',
						entry: [
							assign(({ context }) => ({
								drain: { token: Object.freeze({}), lease: required(context.lease) }
							})),
							'invalidate',
							'requestDrain'
						],
						on: {
							...retainedFacts.on,
							DRAINED: [
								{
									guard: and(['matchingDrain', 'closing']),
									target: '#workspace-selection.closed',
									actions: 'clearReleased'
								},
								{
									guard: and(['matchingDrain', 'suspending']),
									target: '#workspace-selection.bound.suspended',
									actions: 'clearReleased'
								},
								{
									guard: 'matchingDrain',
									target: '#workspace-selection.bound.assessing',
									actions: 'clearReleased'
								}
							],
							DRAIN_FAILED: [
								{
									guard: and(['matchingDrain', 'unresolvedDrain']),
									target: '#workspace-selection.unresolved',
									actions: 'reportDrainFailure'
								},
								{
									guard: and(['matchingDrain', 'closing']),
									target: '#workspace-selection.closed',
									actions: ['reportDrainFailure', 'clearReleased']
								},
								{
									guard: 'matchingDrain',
									target: '#workspace-selection.bound.drainFailed',
									actions: ['reportDrainFailure', 'clearReleased']
								}
							],
							SUSPEND: { guard: 'currentScope', target: '.suspending' },
							SHUTDOWN: '.closing'
						},
						states: {
							switching: {},
							suspending: {},
							closing: { on: { SELECT: {}, OBSERVED: {}, SUSPEND: {}, SHUTDOWN: {} } }
						}
					}
				}
			},
			closed: {
				type: 'final',
				entry: assign({
					scope: undefined,
					request: undefined,
					observation: undefined,
					lease: undefined,
					drain: undefined
				})
			},
			unresolved: {
				type: 'final',
				entry: assign({ request: undefined, observation: undefined, lease: undefined })
			}
		}
	})
}

/** Public resource selector. Invalidated/draining/terminal scopes never remain usable. */
export function selectWorkspaceLease(
	snapshot: SnapshotFrom<ReturnType<typeof createWorkspaceSelectionMachine>>
) {
	return snapshot.status === 'active' && snapshot.matches({ bound: 'selected' })
		? snapshot.context.lease
		: undefined
}
