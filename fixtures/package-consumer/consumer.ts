// Resolve declarations through package exports, never through src/lib or a source alias.
import * as foundation from 'delightful-local-first'

export const publicEntryPoint: object = foundation

export type {
	AvailableRecoveryScope,
	RecoveryScope,
	RecoveryPhraseCapability,
	RecoveryPhraseEvent,
	RecoveryPhraseView
} from 'delightful-local-first/recovery'
export {
	createRecoveryPhraseMachine,
	selectRecoveryPhraseView
} from 'delightful-local-first/recovery/workflow'
