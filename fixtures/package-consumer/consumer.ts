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

export { createRestorationMachine } from 'delightful-local-first/restoration/workflow'
export type { RestorationInput } from 'delightful-local-first/restoration/workflow'
export type {
	RestorationCapability,
	RestorationEvent,
	RestorationIdentity,
	RestorationReport,
	RestorationResult,
	RestorationScope
} from 'delightful-local-first/restoration/contracts'
export { createJazzRestorationAdapter } from 'delightful-local-first/backend/jazz/restoration'

export { restorationMachine } from 'delightful-local-first/restoration/workflow'
export type { SuppliedRestorationInput } from 'delightful-local-first/restoration/workflow'

export {
	createSessionAcquisitionMachine,
	createSessionStartupMachine,
	selectAcquiredSession
} from 'delightful-local-first/session/workflow'
export type {
	SessionOwnerEvent,
	SessionOwnerInput,
	SessionOwnerRef,
	SessionStartupInput,
	SessionStartupEvent
} from 'delightful-local-first/session/workflow'
export type {
	SessionScope,
	SessionFailure,
	SessionOpenCapability,
	SessionOwnerReply,
	SessionStartupReport,
	SessionStartupOutput
} from 'delightful-local-first/session/contracts'
export { createJazzSessionAcquisition } from 'delightful-local-first/backend/jazz/session'
