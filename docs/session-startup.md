# Session acquisition and startup attachment

Status: implementation for review. No new session tests have been added or run, and Finance's
runtime is unchanged. See [the ownership design](../specs/001-local-first-foundation/startup/plan.md).

## Entries and host wiring

```ts
import {
	createSessionAcquisitionMachine,
	createSessionStartupMachine,
	selectAcquiredSession
} from 'delightful-local-first/session/workflow'
import { createJazzSessionAcquisition } from 'delightful-local-first/backend/jazz/session'
import type { SessionScope } from 'delightful-local-first/session/contracts'
```

The contracts entry is actor/SDK-free; workflow imports XState only. The Jazz entry exposes one
configured public createJazzSession leaf and a non-secret binding token. Config is captured for the
owner lifetime; its nested store/auth objects remain host-owned and must not be mutated to change
an existing environment. No default app/server, initial-identity policy, or persistence mode is chosen.

In its browser integration boundary, the host creates and retains one acquisition actor using the
adapter's `{ binding, capability }` as input, optionally with an already-owned `existing` session.
It must not create/start this owner at SSR import or abandon it on layout unmount. Use the public
selectAcquiredSession selector for existing backend integration accessors, not private context paths.
A returned reference does not establish signed-in identity, SDK status, workspace access, or freshness.

The application invokes a startup attachment with `{ reportTo }`. It starts in waiting and acquires
nothing until browser mount sends START with `{ owner, scope }`. Scope has the owner's binding,
a new opaque attachment token, and a non-negative safe-integer generation. Tokens cannot be reused
by another attachment. After START the owner/binding are fixed; replacement requires releasing that
attachment and creating another. No actor registry or promise bridge is involved.

## Messages and failure policy

The attachment reports SESSION_STARTING, SESSION_ACQUIRED, and SESSION_STARTUP_FAILED with scope.
Acquired also carries the generic session reference for the integration owner. These private actor
messages and all resource-bearing snapshots/inputs must not be logged, inspected, serialized, or
passed to pure presentation. Failure reasons are only openFailed, invalidRequest, or ownerFailed.
The host validates scope and derives presentation from those reports; no new strings/UI are added.

The acquisition owner remembers active request recipients and deduplicates attachment tokens.
Matching generation and recipient are checked in guards. Successful SDK settlement publishes to
current recipients; a later request gets the retained session rather than issuing another SDK call.
Failed acquisition is remembered. ACQUIRE reports failure; only RETRY_ACQUIRE with a fresh generation
can reopen after failure. The attachment increments generation on explicit RETRY. Duplicate retries
while opening join the same invocation; replaying the same retry after failure cannot reissue it.
Attachments already in failed state require their own explicit retry to accept a subsequent result.

## Release, errors, and limits

After draining its workspace/transfer/restoration owners, the application sends SHUTDOWN to its
startup attachment and waits for finite `{ outcome: 'closed' }` output. The attachment clears its
session reference and sends RELEASE. The owner removes the matching recipient before RELEASED;
a stale release cannot delete a newer request. Retired tokens are held only in a WeakSet so delayed
ACQUIRE messages cannot re-register them without keeping obsolete attachment objects alive.

The SDK invocation belongs to the longer-lived acquisition owner. Release neither stops it nor
closes/logout the session. With no remaining requesters, the owner still retains the eventual
session or failure. Reattaching uses that retained outcome. In-flight replies during release cannot
reattach the closing child; stale scopes and duplicate START/RETRY events are ignored.

The attachment invokes one public actor-lifecycle subscription while bound, including while waiting
for release acknowledgement. Error/complete or subscription acquisition failure becomes OWNER_FAILED
without raw error data. A public lifecycle-status check also detects owners already stopped before
subscription; XState 5.33 does not replay complete for a stopped snapshot. The subscription is
removed when binding ends. Failure during release closes
without awaiting a dead owner; ordinary owner failure reports once and accepts SHUTDOWN, without
creating a replacement owner. A crashed/stopped owner may have uncertain issued SDK work: this code
cannot infer cancellation or rollback and must not silently replace it.

There is no acquisition-owner shutdown/disposal API in this slice. Stopping it is not SDK cleanup.
The host keeps it alive across application attachments. Final session close and coordinated
configuration replacement need their own resource-owner protocol. Public SDK creation failures may
include SDK-private partial setup; no returned handle exists for this library to invent cleanup.

## Recursive machine-first audit

- Acquisition states assess supplied reference, idle, opening, failed, and acquired. One invoked
  backend call opens; guards/actions own deduplication, publication, remembered failure, fresh retry,
  and recipient release. The owner never awaits a manually started child or caches a promise outside
  that invocation. WeakSet membership is a resource-retirement fact, not a mirrored workflow phase.
- Attachment states own waiting, requesting/retrying, attached, failed, releasing, owner failure,
  and terminal closed. Recipient messaging uses typed sendTo/enqueueActions. The sole callback actor
  acquires/releases one XState lifecycle subscription and bridges errors; it performs no business
  workflow. Local helpers are correlation predicates or required-value invariants.
- The backend closure copies configuration and delegates open to exactly one SDK creation call.
  It has no branch that chooses identities, bootstraps data, makes preflight requests, or retries.
  SDK internal orchestration remains owned by the SDK, not duplicated in library promise actors.

## Review and next checks

Types, formatting, lint, package declarations, and publint are checked before review. They do not
prove request ordering, interruption, SDK initialization behavior, or cold local availability.
After approval add focused acquisition/attachment tests for shared/pending/supplied reuse, explicit
retry across remounts, delayed success/failure after final release, stale scopes, duplicate/replayed
retry, old release versus a newer generation, dead-owner release, subscription acquisition/cleanup,
no-close/logout, and waiting SSR behavior. Validate the new public entries in the built consumer.

Only then adopt the packed library in Finance. Its existing startup/readiness fixtures must change
to the public protocol before tests run; preserve restore and navigation regression coverage and
qualify changed cold-start behavior using its disposable wire-proxy/offline harness. This slice
adds no Finance archive, runtime, localization, schema, data, or server changes.
