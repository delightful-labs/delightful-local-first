/** Non-secret correlation. Attachment tokens are unique to one attachment lifetime. */
export type SessionScope = Readonly<{
	binding: object
	attachment: object
	generation: number
}>

export type SessionFailure = 'openFailed' | 'invalidRequest' | 'ownerFailed'

/** One backend creation call; cache, sharing, retry, and release belong in the owner machine. */
export type SessionOpenCapability<Session extends object> = Readonly<{
	open: () => Promise<Session>
}>

/** Private integration messages: session payloads must never be serialized or inspected. */
export type SessionOwnerReply<Session extends object> =
	| Readonly<{ type: 'ACQUIRED'; scope: SessionScope; session: Session }>
	| Readonly<{ type: 'ACQUISITION_FAILED'; scope: SessionScope; reason: SessionFailure }>
	| Readonly<{ type: 'RELEASED'; scope: SessionScope }>

export type SessionStartupReport<Session extends object> =
	| Readonly<{ type: 'SESSION_STARTING'; scope: SessionScope }>
	| Readonly<{ type: 'SESSION_ACQUIRED'; scope: SessionScope; session: Session }>
	| Readonly<{ type: 'SESSION_STARTUP_FAILED'; scope: SessionScope; reason: SessionFailure }>

export type SessionStartupOutput = Readonly<{ outcome: 'closed' }>
