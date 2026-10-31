// Resolve actual built entries. Synthetic ownership resources never create or close an SDK client.
import { createActor, fromTransition, waitFor } from 'xstate'
import { createJazzSessionAcquisition } from 'delightful-local-first/backend/jazz/session'
import {
	createSessionAcquisitionMachine,
	createSessionStartupMachine,
	selectAcquiredSession
} from 'delightful-local-first/session/workflow'
import 'delightful-local-first/session/contracts'

const backend = createJazzSessionAcquisition({
	appId: 'package-session',
	serverUrl: 'http://127.0.0.1:9'
})
if (typeof backend.capability.open !== 'function') throw new Error('Session creation entry missing')
const session = { id: 'synthetic package session' }
let opens = 0
const owner = createActor(createSessionAcquisitionMachine(), {
	input: {
		binding: backend.binding,
		capability: {
			open: async () => {
				opens += 1
				return session
			}
		}
	}
}).start()
const reporter = createActor(
	fromTransition((count, event) => (event.type === 'SESSION_ACQUIRED' ? count + 1 : count), 0)
).start()
const first = createActor(createSessionStartupMachine(), { input: { reportTo: reporter } }).start()
const second = createActor(createSessionStartupMachine(), { input: { reportTo: reporter } }).start()
try {
	first.send({
		type: 'START',
		owner,
		scope: { binding: backend.binding, attachment: {}, generation: 0 }
	})
	await waitFor(reporter, (snapshot) => snapshot.context === 1)
	first.send({ type: 'SHUTDOWN' })
	await waitFor(first, (snapshot) => snapshot.status === 'done')
	second.send({
		type: 'START',
		owner,
		scope: { binding: backend.binding, attachment: {}, generation: 0 }
	})
	await waitFor(reporter, (snapshot) => snapshot.context === 2)
	second.send({ type: 'SHUTDOWN' })
	await waitFor(second, (snapshot) => snapshot.status === 'done')
	if (opens !== 1 || selectAcquiredSession(owner.getSnapshot()) !== session) {
		throw new Error('Packaged session acquisition did not retain the shared reference')
	}
} finally {
	first.stop()
	second.stop()
	reporter.stop()
	owner.stop()
}
