# Public Foundation Contract — Design Draft

**Status**: Proposed behavioral/interface design for review. No package or API is implemented.
The draft is not stabilized until two real backends satisfy the agreed mandatory scenarios.
[DXOS's documented membership/access model](../qualification.md) remains under qualification;
app-required domain restrictions must not be claimed without evidence of enforcement.

## Package and Dependency Boundaries

Proposed distribution units are core, Svelte bindings, DUI compositions, reusable conformance
checks, and independently published backend plugins. Names/publication namespaces remain a
release decision; these logical units do not create a workspace or dependencies in this phase.
Core owns contracts and XState workflow logic and has no Svelte, DUI, or backend dependency.
Svelte bindings observe core actors; compositions render props and callbacks using DUI. Each
backend plugin imports core contracts and its native SDK, never Finance/Clipper domain code.
The conformance package consumes the public contract without importing a particular backend.

This is a trusted in-process plugin model, not a sandbox against malicious plugin code.
Deployment code imports and supplies exactly one plugin plus configuration. No runtime registry,
installation, marketplace, automatic fallback, or user-selected backend is introduced.

## Registration, Compatibility, and Capability Checks

The public entry point accepts an app definition, plugin descriptor/factory, opaque plugin
configuration, and a platform host. Core validates contract compatibility, the baseline, app
requirements, and policy support before enabling data or identity-dependent operations.
Secrets are resolved by the plugin/host; descriptors and errors contain no secret configuration.

Proposed contract series is `0.1`: exact major/minor compatibility during pre-1.0 design, with
nonbreaking patch changes. Published plugin version and native SDK/server/source versions are
recorded independently. Unknown required capabilities fail with their names identified; optional
unknown metadata does not authorize an operation. Capabilities describe guarantees, not just APIs.

Mandatory baseline groups:

- Identity creation/resumption, recovery, second-device access, and explicit same-backend reuse.
- Private/shared workspaces, invitations, backend-defined membership/access, and app-required policies.
- Portable schemas/CRUD/query observations and confirmed local persistence.
- Explicit lifecycle cleanup, actionable errors, and documented sync/access semantics.

Optional transaction groups are `transactions.localAtomic` and `transactions.authorityValidated`.
Neither implies the other or atomic remote observation. Each needs its own conformance scenarios.
App-required capabilities augment the baseline; they cannot subtract permissions or durability.
A declaration is not certification: conformance reports separately identify compatibility,
baseline compliance, app qualification, source evidence, and executed results.

A plugin unable to enforce an app-required policy dialect must fail preflight before dependent
operations. A foundation-side check on its own mutation functions does not establish storage-boundary
enforcement against direct native access.

## Conceptual Public Surface

The following names define responsibility and inputs/outputs, not final TypeScript signatures.
All ordinary values are typed, detached snapshots; plugins keep native proxies/handles private.

| Surface                        | Inputs                                                        | Outputs / ownership                                                                  |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| createFoundation               | app definition, selected plugin/config, platform host         | One lifecycle owner; no implicit identity creation                                   |
| start / close                  | abort signal for start; explicit lifecycle commands           | Lifecycle snapshots; close waits for required cleanup/persistence or reports failure |
| identity commands              | create, recover, connect existing, second-device flow, logout | Operation/interaction handles and explicit identity outcomes                         |
| workspace commands             | list/observe, create personal/shared, select workspace        | Scoped snapshots; selection does not bypass membership                               |
| membership commands            | invite, accept/reject, change/revoke access                   | Authorization-scoped outcomes and idempotent invitation handling                     |
| scope.observe                  | declared collection and portable query                        | Loading/empty/ready/error snapshots and idempotent dispose                           |
| scope.create / update / delete | declared collection, validated values/ID                      | Operation handle tracking local durability and later settlement                      |
| scope.transaction              | required transaction capability and grouped plan              | One transaction outcome with exactly the declared guarantees                         |

Lifecycle commands are serialized. Repeated start shares the current start attempt; close is
idempotent, rejects new work, releases observations/actors and plugin resources, and waits for
promised local persistence. Failed startup cleans partial resources before retry. Cancelling
start never silently creates an identity. Persisted writes are not discarded to simulate success.
An identity handoff that cannot safely complete while offline reports pending/blocked failure
rather than claiming the new identity is active; plugins document their handoff constraints.

Close, logout, and cancellation have different outcomes:

- Close releases the foundation runtime and preserves persisted session credentials according
  to plugin policy; it is not logout and does not revoke devices or workspace membership.
- Logout ends the selected local session, invalidates its scopes and presentation caches, and
  invokes the plugin's documented credential-selection cleanup. Retained recovery roots,
  external provider sessions, and other devices are not implicitly revoked or erased. Their
  retention must be disclosed by the plugin rather than inferred from the logout label.
- Cancellation abandons a particular pending interaction, with the commit limits described
  below; it does not substitute for logout or undo an identity admission.

A failed close must remain retryable through the owning runtime with the failure visible;
idempotence does not mean reporting successful closure after failed persistence. Existing
handles cannot issue new data operations while closing or after invalidation. They fail with
`lifecycle.notReady` or `scope.stale` rather than silently rebinding to the new identity/workspace.
The foundation clears its own snapshots/caches; it cannot erase copies already retained by
consumer code or data already disclosed to another device.

## Portable Query Semantics

App schemas follow [data-model.md](../data-model.md). Each data scope is bound to one ready
session/workspace generation. A caller cannot obtain another workspace by injecting its ID into
a query; plugins validate the scope at storage boundaries as well as core validation.

The proposed query descriptor contains collection, AND predicates, ordered field/direction pairs,
and an optional positive integer result limit. Equality supports compatible scalar/reference
values; null and nonnull checks are explicit. Numeric/instant range operators are gt/gte/lt/lte.
No OR queries, joins, aggregates, pagination/cursors, full-text search, or arbitrary predicate
functions are part of this draft. Related records use separate observations.

Null is distinct from an absent field; portable records materialize nullable fields. Range
comparison with null never matches. Sort ascending/descending is deterministic: explicit nulls
last in both directions, numeric/instant comparisons by value, strings by Unicode scalar order,
and record ID ascending as the final tie-break. Explicit user sorting precedes the tie-break;
without user sorting, use ID ascending. Plugins must normalize different native ordering or fail
the relevant qualification; exact string/number round trips need conformance checks.

Apply predicates, sorting, then limit. A limit bounds returned results only, not downloaded data
or backend work. Plugins disclose when filtering/sorting is local and what data must be available.
Local postprocessing is permitted only on authorized data with a complete candidate set for the
reported coverage; filtering an arbitrary native top-N and calling it the portable top-N is invalid.
No adapter may silently drop a predicate or approximate a comparison.

Each observation reports readiness separately from coverage (`local`, `backendConfirmed`, or
`unknown`). Local/unknown empty results describe currently available matching data, not proof that
no authorized matching data exists elsewhere. Backend-confirmed coverage can be advertised only
with a documented native confirmation; network connectivity alone is insufficient.

Updates publish whole ordered result snapshots, with loading/empty/ready/error discriminated
states. Observations are live as records change; errors include retryability. Disposing or
invalidating a generation stops delivery, clears retained results, and ignores late callbacks.
No prior identity's data may survive into a new scope's presentation snapshot.

The draft state types make mutually exclusive readiness explicit; these are documentation
examples, not generated source files:

```ts
type Coverage = 'local' | 'backendConfirmed' | 'unknown'

type FoundationErrorCode =
	| 'contract.incompatible'
	| 'capability.missing'
	| 'schema.unsupported'
	| 'policy.unsupported'
	| 'input.invalid'
	| 'authorization.denied'
	| 'offline.unavailable'
	| 'persistence.failed'
	| 'synchronization.rejected'
	| 'operation.cancelled'
	| 'scope.stale'
	| 'lifecycle.notReady'
	| 'backend.failed'

type FoundationError = {
	code: FoundationErrorCode
	messageKey: string
	retryable: boolean
}

type ObservationSnapshot<T> =
	| { status: 'loading' }
	| { status: 'empty'; coverage: Coverage }
	| { status: 'ready'; coverage: Coverage; rows: readonly [T, ...T[]] }
	| { status: 'error'; error: FoundationError }

type LocalPersistence =
	| { status: 'pending' }
	| { status: 'durable' }
	| { status: 'failed'; error: FoundationError }

type RemoteSettlement =
	| { status: 'pending' }
	| { status: 'accepted' }
	| { status: 'rejected'; error: FoundationError }
	| { status: 'unknown' }
```

A durable status records the achieved local persistence milestone; it does not promise that a
later authority rejection cannot remove the change. The operation's settlement reports that
subsequent event. Retryability indicates a retry may be offered, not permission to replay a
possibly committed mutation automatically.

## Portable Authorization Declarations

Workspace membership is the baseline: nonmembers are denied, and access for members follows the
selected backend's documented model. Membership-management authority is checked separately. Any
app-required domain restriction is enforced at the backend/storage boundary, not only by UI or
foundation-side filtering. Native optimistic local state may precede final authority rejection;
this cannot be reported as final authorization or accepted by other authorized replicas as a
legitimate write. Qualification records the enforcement point and timing, including offline limits.

Authorization is default-deny per protected operation. The effective grant is baseline workspace
membership **AND** the app's applicable policy; OR branches inside an app policy never bypass
membership. The plugin's trusted membership source is not an app-writable grant table. Absence of
a required grant denies access; the app cannot authorize an operation by omitting its policy
declaration. Collections without extra domain restrictions must declare use of the backend's
baseline workspace policy explicitly.

Apps declare additional policies in a small typed, declarative policy tree attached to each
collection/operation. The proposed first dialect supports comparisons between declared record
fields, authenticated identity/account values, and literals; AND/OR policy composition; and
existence of an app-declared grant record with explicit key/workspace correlations. OR in an
access policy does not add OR to the public data-query baseline. Arbitrary callbacks, downloaded
code, native query objects, and UI-only checks are not policy declarations.

The app owns grant collections and domain scope fields. Foundation core supplies the expression
model, not finance-specific roles, ledger selection, or permissions. Plugins compile/enforce the
same declaration in native policies or another explicitly reviewed storage enforcement mechanism.
Reads/writes of grant records themselves require protected policies; callers cannot self-grant.
Updates check both the old record's authorization and the proposed new record's domain scope.
The record ID and workspace binding are immutable through ordinary update; attempts to change
either are rejected. Moving/copying records between workspaces is not a portable v1 operation.
Deletes require authorization of the old record.
Policy compilation must detect unsupported/cyclic grant dependencies and fail preflight with the
policy ID and reason; it must not ignore clauses or accept a JS predicate instead.

The dialect is a proposed minimum to model concrete consumer grants, not an implemented universal
policy engine. A backend may map logical workspaces to multiple native spaces, but must preserve
private workspace protection and each app-required access rule. Backend-specific membership levels
are not normalized into a mandatory reader/writer distinction.

## Operations, Durability, and Transactions

Operation handles report an ID, scope, validated input outcome, and independently discriminated
local persistence and remote settlement. Local states are pending/durable/failed; settlement is
pending/accepted/rejected/unknown. A local durable result resolves only after the native persistence
acknowledgement and survives an offline restart absent a later explicit rejected/deleted outcome.
An operation may be locally durable while settlement is pending, or later become rejected.

Connectivity is independent. The plugin must not report accepted/synchronized from online status,
and must use unknown when no operation-specific settlement evidence exists. While the runtime
owns the session, later permission/sync rejection remains observable through its operation event
stream even if the original form has closed; resolving a local wait must not remove the listener.
After restart, reconcile unsettled operations using available native evidence and report unknown
when their settlement cannot be established. Plugins document native recovery/diagnostic retention
limits; this draft does not require a universal operation journal or indefinite event history.
Missing diagnostics must never become assumed acceptance or an automatic retry. No exactly-once
remote execution or implicit safe retry is promised; do not auto-retry mutations whose outcome
is unknown.

Cancelling an interaction clears its transient secrets and UI delivery. It does not roll back an
already committed write or revoke an admitted device. Before commit, a plugin may abort; after
commit, show the actual persisted/pending/failed outcome without inventing cancellation success.
Session/workspace invalidation detaches presentation but does not discard unsettled durability
work; the owning runtime must retain/reconcile it or report inability to close safely.

`transactions.localAtomic` requires all-or-none persisted group state across local failure and
offline restart. `transactions.authorityValidated` requires authoritative conflict validation of
related reads/writes before acceptance; authority unavailability is pending or failure. Both
require declared operation scope and separate documentation of local/remote subscription visibility.
Business invariants under concurrent offline changes are not inferred from grouped local writes.
Unsupported transaction requests fail before starting any group member.

## Errors, XState, and Presentation

Errors expose a stable code, operation/policy/capability context, retryability, and a localization
key. Proposed categories are incompatible contract, missing capability, unsupported schema/policy,
invalid input, unauthorized, unavailable offline, persistence failure, synchronization rejection,
cancelled, and backend failure. Sanitize native diagnostics; never serialize tokens, recovery
roots, or transient secret form values into ordinary snapshots, logs, or actor inspection data.

XState v5 actors own startup/shutdown, session and workspace transitions, identity interactions,
and operation lifecycles. Children own plugin subscriptions and abort/cleanup. A generation token
on each asynchronous result prevents stale updates after scope changes. The plugin interface is
behavioral and need not require third-party authors to use XState internally.

Svelte bindings expose lifecycle-owned read-only snapshots and command callbacks. Pure DUI views
receive only props/callbacks and localizable presentation values. Integration modules own actors,
queries, and plugin calls; no actor/session initialization in rendered presentation components.
Consumers own routes/layouts and integrate compositions where needed.

For localization, consumers use their Paraglide-generated functions to construct a typed message
bundle; compositions receive those strings/functions through props. The foundation does not
choose a global locale, import one app's generated messages, or require consumer routing. Demo
hosting will use Paraglide from the beginning; no hardcoded visible text in future components.

Backend-native identity steps use typed interaction requests for supported generic form/action
steps or an explicitly described external native flow. Sensitive fields stay in an ephemeral
interaction controller, never shared actor context. An unavailable step produces an actionable
unsupported-flow error; no assumption that every backend fits one recovery dialog sequence.
Identity reuse must explain authority and native workspace discovery before explicit connection.

DUI's existing Dialog/Popover primitives are reused. Focus return, keyboard dismissal, status
announcements, and secret cleanup remain composition acceptance criteria. A future UI discovery
note must cite observed consumer/local-first app behavior before recommending missing primitives;
no new primitive or external-app UX discovery result is asserted by this contract draft.
