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

export { AccountRecovery } from 'delightful-local-first/recovery'
export { createRecoveryMessages } from 'delightful-local-first/recovery/messages'
export type { RecoveryMessages } from 'delightful-local-first/recovery/messages'

export { default as RecoveryPhrase } from 'delightful-local-first/recovery/svelte'
export { createJazzRecoveryAdapter } from 'delightful-local-first/backend/jazz/recovery'
export type { RecoveryScopeSource } from 'delightful-local-first/recovery/contracts'
