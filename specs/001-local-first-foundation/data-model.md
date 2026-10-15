# Foundation Data Model — Design Draft

**Status**: Proposed for review, not a persisted schema or stabilized API. Read alongside
[the contract](contracts/foundation.md) and [backend evidence](qualification.md).

## Ownership and Identifiers

The app declares its domain collections and fields once using the portable schema descriptor.
The plugin translates them into native storage. No Finance or Clipper collection belongs in
foundation core. The foundation describes identity, session, workspace, membership, invitation,
and lifecycle state; plugins own their actual durable representation and migrations.

Identifiers are opaque nonempty strings qualified by backend and app context, with distinct
TypeScript types for identity, account, workspace, membership, invitation, record, and operation.
Use typed constructors/validation rather than consumer casts. IDs are stable within the relevant
backend/context; do not infer cross-backend identity or a global account ID from equal strings.
Domain references identify a declared collection and record ID; they are not native proxy objects.

## Entities

| Entity                 | Required conceptual fields                                                                    | Relationships and rules                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Plugin descriptor      | plugin ID, plugin version, supported contract versions, capabilities, semantics documentation | Independently distributed; no credential values in metadata                                  |
| App definition         | app ID, domain schemas, permission declarations, additional required capabilities             | Foundation baseline is always required; deployment supplies one explicit plugin              |
| Identity               | backend identity ID                                                                           | May map to different app accounts; credentials remain inside plugin/session boundary         |
| App account            | account ID, identity ID, app ID                                                               | Jazz's separate app accounts fit here; no assumption that DXOS requires separate account IDs |
| Session                | session ID, identity, optional native app account, generation, lifecycle state                | Generation invalidates pending work and observations after identity changes                  |
| Workspace              | workspace ID, personal/shared kind, display name                                              | Protected logical scope; a plugin may map it to multiple native spaces if guarantees hold    |
| Membership             | membership ID, workspace ID, identity ID, backend-defined access, management authority        | Management authority is distinct from data access; native owner/admin labels map explicitly  |
| Invitation             | invitation ID, workspace ID, granted access, intended-recipient constraints, lifecycle        | Tokens and pairing material are transient secrets, not ordinary entity fields                |
| Domain record          | immutable record ID/workspace ID, declared app fields                                         | Workspace binding is enforced; changes cannot escape scope by changing a field               |
| Permission declaration | stable policy ID/version, protected collection, allowed operations, expression                | App-owned domain restriction compiled/enforced by plugin; never an arbitrary UI predicate    |
| Observation            | observation ID, session/workspace generation, query, readiness, coverage                      | Runtime-owned, not app persistence; disposal terminates delivery                             |
| Operation              | operation ID, owner scope, local persistence state, remote settlement, error                  | Tracks later rejection separately from initial persistence                                   |

Workspace access levels and membership roles follow the selected backend's supported model and
must be documented by its plugin. Ownership/admin authority for creating invitations or changing
membership is distinct from data access and must be mapped explicitly. The foundation does not
require a generic reader/writer role pair. Granting private personal access must be idempotent on
resumption; do not create another identity or workspace on transient failure.

## Portable Domain Fields

Initial proposed scalar descriptors are string, boolean, finite number, safe integer, UTC instant,
and typed record reference, each with explicit nullability. UTC instants use integer milliseconds
at the public boundary; adapters may convert to native timestamp objects. Safe integers must
round-trip exactly within JavaScript's safe range. Plugins must reject schemas they cannot
represent faithfully rather than round, truncate, stringify implicitly, or downgrade constraints.

All stored/read fields are materialized: a nullable field has an explicit null value, while an
omitted patch field means unchanged. Required fields cannot be omitted on create. An omitted
nullable create field normalizes to null. Explicit undefined is not a portable stored value;
unknown fields and attempts to patch record ID/workspace binding are rejected. Arrays, arbitrary
JSON, binary data, custom CRDT types,
and polymorphic payloads are not included in this proposed first scalar set; richer schema types
need explicit later contract evolution. These are reviewable design choices, not claims about
which native types either backend supports.

References are same-workspace by default; cross-workspace references are outside the portable
v1 contract. Reference lookup is a separate observation and remains authorization-scoped. An ID
reference does not imply a join, cascade deletion, uniqueness check, or foreign-key transaction.
Whether the target is absent, deleted, unavailable locally, or unauthorized must not leak data
or be mistaken for referential-integrity enforcement.

A normal delete removes the record from current portable query results after local acceptance.
It does not promise physical erasure from CRDT history, backups, or other replicas. Native
retention and revocation limits remain qualification metadata.

## State and Validation Rules

- Startup: idle → checking compatibility → opening → restoring session → ready, unauthenticated,
  or failed. Identity creation is an explicit command, never a recovery from a transient error.
- Identity transitions: ready/unauthenticated → interaction → cleanup/handoff → ready, cancelled,
  or failed. Plugins describe backend-native steps and authority consequences before connection.
- Invitation: pending → accepted, rejected, expired, or revoked. Repeated acceptance returns the
  existing membership or an explicit terminal outcome, never a second membership.
- Workspace change increments its generation, clears prior presentation data, and releases old
  observations before publishing replacement data. Session replacement does the same for all scopes.
- Closing the runtime, logging out the selected session, and cancelling an interaction are
  distinct commands. Logout invalidates handles/caches; credential retention and revocation
  follow the plugin's documented native behavior, not an assumed global sign-out.
- Permission changes are backend-enforced at the documented boundary/time. Offline replicas may
  retain previously disclosed data; neither membership removal nor logout promises its erasure.
- Durable acknowledgement follows actual plugin persistence confirmation. Later authority rejection
  can remove/reconcile a previously durable local change. Runtime listeners retain later errors;
  after restart, unavailable settlement evidence is reported as unknown, never assumed accepted.

Schema evolution is versioned and app-owned. Initial design supports opening the declared current
schema only when the plugin has a valid deployment/migration path. Unsupported changes fail startup
with an actionable error; a universal migration DSL and backend-to-backend migration are not v1
features. Concrete migration mechanics stay with plugins until separately designed and qualified.
