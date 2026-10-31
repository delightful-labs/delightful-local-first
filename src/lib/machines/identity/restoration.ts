import { assign, fromPromise, not, raise, sendTo, setup, stateIn } from 'xstate'
import type { ActorRef, Snapshot } from 'xstate'
import type {
	RestorationCapability,
	RestorationEvent,
	RestorationIdentity,
	RestorationReport,
	RestorationResult,
	RestorationScope
} from '../../contracts/restoration.js'

/** Sensitive input: never inspect, persist, or retain this actor's inputs/events/snapshots. */
export type RestorationInput = Readonly<{
	scope: RestorationScope
	phrase: string
	reportTo: ActorRef<Snapshot<unknown>, RestorationReport>
}>

type Context = {
	capability: RestorationCapability
	scope: RestorationScope
	reportTo: RestorationInput['reportTo']
	phrase: string | undefined
	credential: string | undefined
	mutation: 'notStarted' | 'settled'
	result: RestorationResult | undefined
}
type Event = RestorationEvent | { type: 'RELEASE_CREDENTIAL' }

function required<Value>(value: Value | undefined): Value {
	if (value === undefined) throw new Error('Restoration input unavailable')
	return value
}

/** Invoke under a host that survives its UI and waits for terminal output before stopping. */
function defineRestorationMachine<Input extends RestorationInput>(
	readCapability: (input: Input) => RestorationCapability
) {
	const actors = {
		parse: fromPromise<string, { capability: RestorationCapability; phrase: string }>(({ input }) =>
			input.capability.parsePhrase(input.phrase)
		),
		restore: fromPromise<
			void,
			{ capability: RestorationCapability; scope: RestorationScope; credential: string }
		>(({ input }) => input.capability.restoreIdentity(input.scope, input.credential)),
		identity: fromPromise<
			RestorationIdentity,
			{ capability: RestorationCapability; scope: RestorationScope }
		>(({ input }) => input.capability.readIdentity(input.scope))
	}
	const model = setup<
		Context,
		Event,
		typeof actors,
		{},
		{ settled: undefined },
		{ currentBinding: undefined; cancellingRestore: undefined; matchingPermit: undefined },
		never,
		string,
		Input,
		RestorationResult
	>({
		actors,
		actions: {
			settled: assign({ mutation: (): Context['mutation'] => 'settled' })
		},
		guards: {
			currentBinding: ({ context }) => context.capability.isCurrentBinding(context.scope.binding),
			cancellingRestore: stateIn({ restoring: 'settlingCancellation' }),
			matchingPermit: ({ context, event }) =>
				event.type === 'PREPARED' &&
				event.binding === context.scope.binding &&
				event.attempt === context.scope.attempt &&
				context.capability.isCurrentBinding(context.scope.binding)
		}
	})
	const clearSecrets = model.assign({ phrase: undefined, credential: undefined })
	const finish = (outcome: 'invalid' | 'failed' | 'identityUnavailable') =>
		model.createStateConfig({
			type: 'final',
			entry: [
				clearSecrets,
				assign({
					result: ({ context }): RestorationResult =>
						outcome === 'invalid'
							? { ...context.scope, outcome, mutation: 'notStarted' }
							: { ...context.scope, outcome, mutation: 'settled' }
				})
			]
		})

	return model.createMachine({
		id: 'identity-restoration',
		initial: 'assessing',
		context: ({ input }) => ({
			capability: readCapability(input),
			scope: { binding: input.scope.binding, attempt: input.scope.attempt },
			reportTo: input.reportTo,
			phrase: input.phrase,
			credential: undefined,
			mutation: 'notStarted',
			result: undefined
		}),
		output: ({ context }) => required(context.result),
		on: {
			CANCEL: '.cancelled',
			SHUTDOWN: '.cancelled',
			BINDING_INVALIDATED: '.cancelled'
		},
		states: {
			assessing: {
				always: [{ guard: 'currentBinding', target: 'validating' }, { target: 'cancelled' }]
			},
			validating: {
				invoke: {
					src: 'parse',
					input: ({ context }) => ({
						capability: context.capability,
						phrase: required(context.phrase)
					}),
					onDone: [
						{ guard: not('currentBinding'), target: 'cancelled' },
						{
							guard: ({ event }) => event.output.trim().length > 0,
							target: 'awaitingPreparation',
							actions: assign({ phrase: undefined, credential: ({ event }) => event.output })
						},
						{ target: 'invalid' }
					],
					onError: [{ guard: 'currentBinding', target: 'invalid' }, { target: 'cancelled' }]
				}
			},
			awaitingPreparation: {
				entry: [
					sendTo(
						({ context }) => context.reportTo,
						({ context }): RestorationReport => ({
							type: 'RESTORATION_VALIDATED',
							...context.scope
						})
					),
					sendTo(
						({ context }) => context.reportTo,
						({ context }): RestorationReport => ({
							type: 'RESTORATION_PREPARE_REQUESTED',
							...context.scope
						})
					)
				],
				always: { guard: not('currentBinding'), target: 'cancelled' },
				on: { PREPARED: { guard: 'matchingPermit', target: 'restoring' } }
			},
			restoring: {
				initial: 'active',
				// XState binds invoke input in this entry microstep before processing the raised event.
				entry: raise({ type: 'RELEASE_CREDENTIAL' }),
				invoke: {
					src: 'restore',
					input: ({ context }) => ({
						capability: context.capability,
						scope: context.scope,
						credential: required(context.credential)
					}),
					onDone: [
						{ guard: 'cancellingRestore', target: 'cancelled', actions: 'settled' },
						{ guard: not('currentBinding'), target: 'cancelled', actions: 'settled' },
						{ target: 'readingIdentity', actions: 'settled' }
					],
					onError: [
						{ guard: 'cancellingRestore', target: 'cancelled', actions: 'settled' },
						{ guard: not('currentBinding'), target: 'cancelled', actions: 'settled' },
						{ target: 'failed', actions: 'settled' }
					]
				},
				on: {
					RELEASE_CREDENTIAL: { actions: clearSecrets },
					CANCEL: '.settlingCancellation',
					SHUTDOWN: '.settlingCancellation',
					BINDING_INVALIDATED: '.settlingCancellation'
				},
				states: {
					active: {},
					settlingCancellation: {
						on: { CANCEL: {}, SHUTDOWN: {}, BINDING_INVALIDATED: {} }
					}
				}
			},
			readingIdentity: {
				invoke: {
					src: 'identity',
					input: ({ context }) => ({ capability: context.capability, scope: context.scope }),
					onDone: [
						{ guard: not('currentBinding'), target: 'cancelled' },
						{
							guard: ({ event }) =>
								event.output.kind === 'ready' && event.output.identityId.trim().length > 0,
							target: 'restored',
							actions: assign({
								result: ({ context, event }): RestorationResult => {
									if (event.output.kind !== 'ready')
										throw new Error('Restoration identity unavailable')
									return {
										...context.scope,
										outcome: 'restored',
										mutation: 'settled',
										identityId: event.output.identityId
									}
								}
							})
						},
						{ target: 'identityUnavailable' }
					],
					onError: [
						{ guard: 'currentBinding', target: 'identityUnavailable' },
						{ target: 'cancelled' }
					]
				}
			},
			restored: { type: 'final', entry: clearSecrets },
			invalid: finish('invalid'),
			failed: finish('failed'),
			identityUnavailable: finish('identityUnavailable'),
			cancelled: {
				type: 'final',
				entry: [
					clearSecrets,
					assign({
						result: ({ context }): RestorationResult => ({
							...context.scope,
							outcome: 'cancelled',
							mutation: context.mutation
						})
					})
				]
			}
		}
	})
}

/** Fixed capability for callers that already own their backend binding at definition time. */
export function createRestorationMachine(capability: RestorationCapability) {
	return defineRestorationMachine((_input: RestorationInput) => capability)
}

/** Invocation-time binding for hosts whose session becomes available after machine definition. */
export type SuppliedRestorationInput = RestorationInput &
	Readonly<{ capability: RestorationCapability }>
export const restorationMachine = defineRestorationMachine(
	(input: SuppliedRestorationInput) => input.capability
)
