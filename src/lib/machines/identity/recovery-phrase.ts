import { assign, fromPromise, not, setup, type SnapshotFrom } from 'xstate'
import type {
	AvailableRecoveryScope,
	RecoveryPhraseCapability,
	RecoveryPhraseEvent,
	RecoveryPhraseView,
	RecoveryScope
} from '../../contracts/recovery-phrase.js'

type Context = { scope: RecoveryScope; phrase: string | undefined }
type RevealedPhrase = { scope: AvailableRecoveryScope; phrase: string }
type Guards = {
	currentScope: undefined
	unchangedObservation: undefined
	availableObservation: undefined
}

function sameScope(left: RecoveryScope, right: RecoveryScope): boolean {
	if (left.kind === 'unavailable' || right.kind === 'unavailable') return left.kind === right.kind
	return (
		left.identityId === right.identityId &&
		left.binding === right.binding &&
		left.generation === right.generation
	)
}

/** Sensitive actor: its context and invoke output must not enter inspection or snapshot history. */
export function createRecoveryPhraseMachine(capability: RecoveryPhraseCapability) {
	const actors = {
		// One leaf plus result correlation. Availability and lifecycle decisions stay in guards.
		reveal: fromPromise<RevealedPhrase, AvailableRecoveryScope>(async ({ input }) => ({
			scope: input,
			phrase: await capability.readPhrase(input)
		}))
	}
	const model = setup<
		Context,
		RecoveryPhraseEvent,
		typeof actors,
		{},
		{},
		Guards,
		never,
		string,
		RecoveryScope
	>({
		actors,
		guards: {
			currentScope: ({ context }) =>
				context.scope.kind === 'available' && capability.isCurrentScope(context.scope),
			unchangedObservation: ({ context, event }) =>
				event.type === 'OBSERVE' &&
				sameScope(context.scope, event.scope) &&
				(event.scope.kind === 'unavailable' || capability.isCurrentScope(event.scope)),
			availableObservation: ({ event }) =>
				event.type === 'OBSERVE' &&
				event.scope.kind === 'available' &&
				capability.isCurrentScope(event.scope)
		}
	})
	const clearPhrase = model.assign({ phrase: undefined })
	const clearScope = model.assign({
		scope: (): RecoveryScope => ({ kind: 'unavailable' }),
		phrase: undefined
	})
	const observeScope = model.assign(({ event }) =>
		event.type === 'OBSERVE' ? { scope: event.scope, phrase: undefined } : {}
	)

	return model.createMachine({
		id: 'recovery-phrase',
		initial: 'assessing',
		context: ({ input }) => ({ scope: input, phrase: undefined }),
		on: {
			SHUTDOWN: '.closed',
			OBSERVE: [
				{ guard: 'unchangedObservation' },
				{ guard: 'availableObservation', target: '.hidden', actions: observeScope },
				{ target: '.unavailable' }
			],
			HIDE: [
				{ guard: 'currentScope', target: '.hidden', actions: clearPhrase },
				{ target: '.unavailable' }
			]
		},
		states: {
			assessing: {
				always: [{ guard: 'currentScope', target: 'hidden' }, { target: 'unavailable' }]
			},
			unavailable: { entry: clearScope },
			hidden: {
				on: {
					REVEAL: [{ guard: 'currentScope', target: 'revealing' }, { target: 'unavailable' }]
				}
			},
			revealing: {
				invoke: {
					src: 'reveal',
					input: ({ context }) => {
						if (context.scope.kind !== 'available') throw new Error('Recovery scope unavailable')
						return context.scope
					},
					onDone: [
						{
							guard: ({ context, event }) =>
								!sameScope(context.scope, event.output.scope) ||
								!capability.isCurrentScope(event.output.scope),
							target: 'unavailable'
						},
						{
							guard: ({ event }) => event.output.phrase.trim().length > 0,
							target: 'revealed',
							actions: assign({ phrase: ({ event }) => event.output.phrase })
						},
						{ target: 'failed' }
					],
					onError: [{ guard: 'currentScope', target: 'failed' }, { target: 'unavailable' }]
				}
			},
			revealed: {
				initial: 'unconfirmed',
				states: {
					unconfirmed: {
						on: {
							CONFIRM: [
								{
									guard: not('currentScope'),
									target: '#recovery-phrase.unavailable'
								},
								{ guard: ({ event }) => event.value, target: 'confirmed' }
							]
						}
					},
					confirmed: {
						on: {
							CONFIRM: [
								{
									guard: not('currentScope'),
									target: '#recovery-phrase.unavailable'
								},
								{ guard: ({ event }) => !event.value, target: 'unconfirmed' }
							],
							COMPLETE: [
								{ guard: 'currentScope', target: '#recovery-phrase.hidden', actions: clearPhrase },
								{ target: '#recovery-phrase.unavailable' }
							]
						}
					}
				}
			},
			failed: {
				entry: clearPhrase,
				on: {
					RETRY: [{ guard: 'currentScope', target: 'revealing' }, { target: 'unavailable' }]
				}
			},
			closed: { type: 'final', entry: clearScope }
		}
	})
}

export function selectRecoveryPhraseView(
	snapshot: SnapshotFrom<ReturnType<typeof createRecoveryPhraseMachine>>
): RecoveryPhraseView {
	if (snapshot.matches('revealed')) {
		if (snapshot.context.phrase === undefined) throw new Error('Recovery phrase missing')
		return {
			kind: 'revealed',
			phrase: snapshot.context.phrase,
			confirmation: snapshot.matches({ revealed: 'confirmed' }) ? 'confirmed' : 'unconfirmed'
		}
	}
	if (snapshot.matches('closed')) return { kind: 'closed' }
	if (snapshot.matches('revealing')) return { kind: 'revealing' }
	if (snapshot.matches('failed')) return { kind: 'failed' }
	return { kind: snapshot.matches('hidden') ? 'hidden' : 'unavailable' }
}
