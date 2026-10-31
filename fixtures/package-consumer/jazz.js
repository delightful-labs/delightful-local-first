// The fixture is a host: its own Jazz instance issues the handle consumed by the built adapter.
import { createAccountManager, exportLocalFirstSecret } from 'jazz-tools'
import { RecoveryPhrase } from 'jazz-tools/passphrase'
import { createJazzRecoveryAdapter } from 'delightful-local-first/backend/jazz/recovery'

/** @type {string | null} */
let stored = null
const manager = await createAccountManager({
	appId: 'recovery-package-consumer',
	serverUrl: 'http://127.0.0.1:9',
	store: {
		read: async () => stored,
		update: async (transform) => {
			stored = transform(stored)
		}
	}
})
const account = manager.createLocalFirst()
const adapter = createJazzRecoveryAdapter(() => manager.getLoggedIn())
try {
	const scope = adapter.observeAccount(account)
	if (scope.kind !== 'available') throw new Error('Packaged adapter did not accept the host scope')
	const phrase = await adapter.capability.readPhrase(scope)
	// Compare booleans so generated credential material cannot enter a failed assertion/report.
	if (RecoveryPhrase.toSecret(phrase) !== exportLocalFirstSecret(account)) {
		throw new Error('Packaged adapter did not recover the host-issued root')
	}
	if (manager.getLoggedIn() !== account)
		throw new Error('Packaged adapter changed the host session')
} finally {
	adapter.invalidate()
	manager.logout()
}
