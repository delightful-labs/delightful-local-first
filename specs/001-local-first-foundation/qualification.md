# Backend Capability Evidence and Design Implications

**Status**: Source review for design; no backend is runtime-qualified.
**Scope**: Existing mandatory requirements are unchanged. This document does not select a
replacement backend, add a service, or make read-only membership optional.

## Evidence Revisions

- Jazz: `45905c42946a07465ca33ec8a84e4180771aff74`.
- DXOS: `0d811677577e239ae9a0f8b6ab035cb9c986835b`.

Both are source snapshots already downloaded for identity investigation, not selected released
SDK/server combinations. Upstream tests were read as evidence where relevant, not executed.
A declared enum or method is not proof of enforcement, persistence, or crash safety.

## Mandatory Data Baseline

| Behavior                         | Jazz source evidence                                              | DXOS source evidence                                            | Design consequence                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Typed records and ID references  | Schema scalar types, nullable columns, and UUID fields            | Typed ECHO objects and references                               | Translate app-owned schemas; never expose native live proxies as portable records                                      |
| Create/read/update/delete        | Mutation runtime and query interface                              | Database add/remove, explicit Entity.update, queries            | Explicit mutation entry points; deletion visibility/history is backend-specific                                        |
| Equality and null checks         | Adapter lowers null to IsNull/IsNotNull for schema columns        | Filter matcher uses strict equality, including null             | Explicit null must be distinguished from missing fields; reject incompatible schemas rather than dropping predicates   |
| Ranges and AND                   | Comparison predicates and conjunctions                            | Filter AST/comparison matcher and AND builder                   | Restrict operators to compatible declared types; specify boundary behavior before freezing API                         |
| Sorting and bounded lists        | Query adapter carries order_by and limit                          | Query.orderBy, Query.limit, Order.property                      | Specify deterministic ID tie-break and null ordering; a bound is not pagination or a replication limit                 |
| Reactive observation and cleanup | Subscription implementation owns unsubscribe/reset/error handling | QueryResult.subscribe returns cleanup                           | Publish detached snapshots and discard obsolete session/workspace generations                                          |
| Locally durable acknowledgement  | Write wait separates local persistence from remote acceptance     | EntityManager.flush defaults to disk, then RepoProxy/host flush | Adapter must await the real persistence path; offline restart and failure behavior still need executable qualification |

Jazz sources: [schema types](https://github.com/garden-co/jazz/blob/45905c42946a07465ca33ec8a84e4180771aff74/packages/jazz-tools/src/schema.ts#L5),
[query lowering](https://github.com/garden-co/jazz/blob/45905c42946a07465ca33ec8a84e4180771aff74/packages/jazz-tools/src/runtime/query-adapter.ts#L320),
[null/comparison lowering](https://github.com/garden-co/jazz/blob/45905c42946a07465ca33ec8a84e4180771aff74/packages/jazz-tools/src/runtime/query-adapter.ts#L495),
[nullable operator examples in upstream tests](https://github.com/garden-co/jazz/blob/45905c42946a07465ca33ec8a84e4180771aff74/packages/jazz-tools/src/runtime/query-adapter.test.ts#L578),
[subscription teardown](https://github.com/garden-co/jazz/blob/45905c42946a07465ca33ec8a84e4180771aff74/packages/jazz-tools/src/svelte/query-subscription.svelte.ts#L72).

The source resolves the earlier generic-null uncertainty more positively than the abbreviated
documentation: IsNull/IsNotNull lowering is general, and upstream examples include nullable bytes
and arrays. This still does not choose those richer field types for the portable v1 schema.

DXOS sources: [add/remove](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo-client/src/proxy-db/database.ts#L599),
[explicit update](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo/src/Entity.ts#L339),
[filter comparison](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo/src/internal/Filter/match.ts#L150),
[filter builders](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo/src/Filter.ts#L336),
[sort and limit](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo/src/Query.ts#L452),
[reactive cleanup](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo-client/src/query/query-result.ts#L160),
[disk flush](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo-client/src/core-db/entity-manager.ts#L1203),
[host save acknowledgement](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo-client/src/automerge/repo-proxy.ts#L294).

Native query primitives make the practical baseline plausible for both backends. Comparison
precision, string collation, absent/null normalization, observation ordering, and crash behavior
are still design/conformance work. Do not claim parity merely because operator names match.

## Authorization: Distinguish Membership Administration from Record Writes

Jazz provides row policies for reads/inserts/updates/deletes, including correlated grants and
old/new-row checks. Finance's selected-account policies provide concrete reference consumer
requirements. Core rejection is separate from optimistic local application: a local write can
appear or persist before the authority rejects it. The portable operation lifecycle must retain
later rejection and must not call local durability proof of final authorization.

Sources: [permission model](https://jazz.tools/docs/auth/permissions),
[mutation errors and durability](https://jazz.tools/docs/writing/writing-data),
[transaction acceptance](https://jazz.tools/docs/writing/transactions).
These documentation links complement the pinned source; they do not establish compatibility
with every published Jazz alpha.

DXOS's current traced native ECHO peer path does not implement the required reader/editor write
separation. Evidence is in the actual authorization flow, not the absence of a tutorial:

1. Production service wiring supplies mesh replication unless P2P replication is disabled.
2. A space trusts every nonremoved member identity, including a READER.
3. Successful peer authentication authorizes that device for the space's replication.
4. The mesh authorization set records space and device, with no read/write role distinction.
5. The host explicitly says classical sync has no inbound gate, and Subduction authorizePut
   is intentionally permissive. The inspected inbound policy does not reject a reader's writes.

Sources: [production wiring](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/sdk/client-services/src/internal/services/layer-specs.ts#L440),
[trusted members](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/sdk/client-services/src/internal/spaces/data-space.ts#L162),
[authenticated-device admission](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/sdk/client-services/src/internal/spaces/data-space-manager.ts#L1017),
[mesh sharing and authorization](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo-host/src/automerge/mesh-echo-replicator.ts#L145),
[inbound policy](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/echo/echo-host/src/automerge/automerge-host.ts#L1166).

Conclusion: the inspected native replication path cannot currently be mapped to FR-007/FR-008
and Story 3's direct read-only-write denial merely by mapping the READER enum. This is a
source-level incompatibility in that path, not an executed exploit result or a claim that no
possible DXOS-based architecture could enforce the requirement.

Space partitioning can potentially express selected read grants by placing protected subsets
in separate spaces. It does not solve reader-versus-editor writes within one shared space.
A foundation adapter that only checks its own mutation calls would leave direct native access
unrestricted and does not satisfy the current spec. A custom lower-level enforcement mechanism
or another version/replication path would require explicit architecture review and qualification;
neither is assumed to exist or silently added by this document.

## Identity, Recovery, and Optional Transactions

Native identity-reuse findings remain as documented in [research.md](research.md): separate app
accounts for Jazz; shared identity/space authority for DXOS. That earlier app-isolation issue
is not reopened by this permission finding. Cross-app authority and workspace read-only roles
are different requirements.

Jazz source/docs support recovery-root export/restore and passkey backup; these can inform a
second-device flow without claiming independently revocable per-device credentials. DXOS HALO
has join and recovery operations, whose enrollment, service dependency, and offline behavior
still need mapping. Neither API presence alone completes recovery qualification.

Atomic local transactions and authority validation remain optional. Jazz has corresponding
mergeable/exclusive APIs, with different offline and visibility behavior. DXOS multi-object
atomic crash persistence and authority validation have not been established by this review.
Do not advertise those capabilities until separately qualified.

## Review Outcome and Next Work

The portable query baseline has concrete native building blocks in both codebases. A common
contract can be drafted provisionally, but the whole mandatory plugin contract cannot be
presented as natively supported by both while the DXOS read-only gap remains.

Before finalizing the authorization contract, decide an evidence-backed route: identify a DXOS
version or enforcement path that meets the existing requirement; explicitly scope an additional
backend enforcement design; or obtain a deliberate user requirement change. Making read-only
optional or selecting another backend is a scope decision, not an automatic fallback.

Continue design only with the limitation visible. No foundation/plugin code, implementation
tests, service, backend replacement, or requirement amendment is authorized by this source audit.

## Follow-up: Alternate DXOS Enforcement Paths

The follow-up inspected legacy feed admission, current host configuration, the proposed
HALO/Keyhive migration, and the source files included in published runtime packages.
No implementation tests or package scripts were executed.

### Published package cross-check

Registry metadata reported `@dxos/client` latest as `0.14.0` at inspection. The public
`@dxos/echo-host@0.14.0` and `@dxos/client-services@0.14.0` archives were downloaded and their
included TypeScript source inspected. They reproduce the same relevant behavior:

- `echo-host` source `automerge/automerge-host.ts`, line 1152: inbound puts are intentionally
  allow-all; line 1179 implements the permissive callback.
- `echo-host` source `automerge/mesh-echo-replicator.ts`, lines 149 and 177: document and
  collection replication check the space/device authorization set, not reader/editor roles.
- `client-services` source `internal/spaces/data-space.ts`, line 167: every nonremoved
  member identity is trusted, including a reader.

Archives: [echo-host 0.14.0](https://registry.npmjs.org/@dxos/echo-host/-/echo-host-0.14.0.tgz),
[client-services 0.14.0](https://registry.npmjs.org/@dxos/client-services/-/client-services-0.14.0.tgz).
The archives and extracted inspection files are under `/private/tmp/dxos-published-audit`.
Archive SHA-256 digests, recorded for reproducibility:

- echo-host: `a3c671175ad8b5c8fbbe705587cfee3b12775575ee28a2e1692ac0315ee3e1a2`.
- client-services: `3df4e84d5b2216f740cdf0a81bb20827ca42d03a464e685734bff73ec156c8f6`.

This cross-check concerns the named packages and paths, not every historical release or
possible custom deployment. The `dev`, `labs`, `main`, and `next` registry tags are not
accepted as alternative permission implementations merely because those tags exist.

### Legacy feed admission

The legacy credential state machine processes `AdmittedFeed` without adding role validation
there, with a comment that contained credentials receive their own validation. The separate
admin/owner restriction governs inviting members, not a general reader-write gate over ECHO
record data. This supplies no missing guarantee for the current native peer data path.

Source: [feed admission and membership administration](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/halo/credentials/src/state-machine/space-state-machine.ts#L236).

### Keyhive is not an installed DXOS solution

DXOS's migration document explicitly says draft. It describes replacing space membership and
access control with Keyhive and states that a prototype runtime was removed from the
now-definitions-only HALO package. No shipped HALO/Keyhive enforcement integration was located
in the audited tree. Selecting the Subduction transport alone does not add Keyhive permission
checks: the existing host wires its own permissive inbound policy.

Sources: [draft status](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/halo/halo/MIGRATION.md#L1),
[planned access-control rewrite and removed prototype](https://github.com/dxos/dxos/blob/0d811677577e239ae9a0f8b6ab035cb9c986835b/packages/core/halo/halo/MIGRATION.md#L130).

Automerge separately documents an alpha `automerge-repo-keyhive` integration with document
read/edit/admin permissions and transport/storage integration. It is a relevant upstream
technology to watch, not proof of DXOS support or a drop-in addition to the current DXOS
identity/space implementation. Adopting it directly would be another backend integration or
substantial DXOS authorization work requiring separate review.

Source: [Automerge's alpha integration guide](https://automerge.org/docs/keyhive/ark-api-guide/).

### Recommended planning treatment

Keep storage-enforced read-only and domain grants in the core contract. DXOS remains a
candidate with a known qualification failure in the inspected native path. The core contract
and conformance design can describe required behavior and fail closed without asserting that
DXOS implements it. Final two-real-backend acceptance remains unsatisfied until a qualifying
second backend or DXOS enforcement path is established.

Do not automatically take on an authorization subsystem, replace the backend, or make
read-only optional. Any of those changes requires an explicit scope decision. Native reader
role mapping alone is no longer an evidence-backed implementation assumption.
