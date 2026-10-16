# Technical Plan: Pluggable Local-First App Foundation

**Branch**: `main` (no dedicated feature branch currently checked out) | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Status**: Phase 1 core design draft prepared for review. Contracts are provisional;
neither backend is runtime-qualified or demonstrated compatible end to end. DXOS has an identified
app-policy enforcement uncertainty; two-backend acceptance remains pending.

## Summary

Design a portable, typed data foundation with independently distributed backend plugins,
XState workflows, Svelte bindings, and DUI identity/workspace compositions. The approved
baseline includes CRUD, ID references, reactive observations, equality/null/range/AND
filters, sorting, and bounded lists. Transactions are separately declared optional
capabilities. Identity reuse follows documented backend-native authority and access behavior;
private workspace protection is mandatory, while app-specific domain restrictions are included
only when required by an approved consumer product requirement.

No foundation, plugin, demonstration, migration, or implementation tests are authorized in
this phase. This plan now includes a provisional core design, not an implementation-ready or
stabilized two-backend mapping. See [research.md](research.md) and [qualification.md](qualification.md)
for evidence and limits.

## Technical Context

- **Language/runtime**: strict TypeScript for future source; Node >=22.12 and pnpm 10.22.0
  are the repository tooling baseline. Pin the implementation toolchain after checking all
  dependency engine requirements; the root minimum is not proof of stack compatibility.
- **Dependencies**: XState for workflows; Svelte 5/DUI/Paraglide for reusable interactions;
  SvelteKit for future demonstration hosting. No application dependencies installed here.
- **Storage**: plugin-owned. Jazz is a required candidate; DXOS is the first second-backend
  candidate. Neither is qualified. Exact SDK/server versions and source revisions must be
  captured together before reproducible validation.
- **Quality**: Oxlint/Oxfmt installed. Strict TypeScript/Svelte checks and full enforcement
  of no-assertion/no-switch rules remain tooling prerequisites before implementation.
- **Future testing**: unit coverage for logic/actors, reusable plugin conformance checks,
  Playwright for user interactions, offline restart, and authorization. Add/run implementation
  tests only after the user approves the exact implementation they cover.
- **Platform/scope**: browser consumers with local persistence; two real backends exercised
  in isolated deployments. No backend migration, binary storage, advanced queries, automatic
  SSO, foundation-wide workspace directory, or identity portability between backend technologies
  in v1. Shared identity does not itself share app data. A future explicit app/workspace request
  and user-approval flow is deferred from v1 pending backend-capability evaluation.
- **Performance**: no numeric SLA is approved. Qualification must record query workload,
  local data availability, execution limits, and timing without inventing parity claims.

## Constitution Check

| Gate                                                                            | Result                                                                                       |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Independently distributable backends, no mandatory backend dependencies in core | Required design boundary; no implementation claim                                            |
| Strict typing and explicit XState lifecycle/cleanup                             | Required; implementation checks remain pending                                               |
| Domain behavior outside foundation; DUI owns generic presentation               | Preserved                                                                                    |
| Portable v1 data contract and optional transactions                             | Requirements resolved; remaining semantics need design/research                              |
| Reused identity with documented native access consequences                      | Required; cross-app data-sharing workflow deferred from v1                                   |
| Private workspace protection; no generic read-only or Finance policy             | Private workspace isolation is mandatory; app-specific domain restrictions are outside the v1 baseline |
| Two real backends meet mandatory requirements                                   | Future acceptance gate; not a prerequisite to designing conformance                          |
| Specification-only scope, incremental review, approval before tests             | Satisfied by documentation-only work                                                         |

Q1/Q2 were resolved explicitly by the user; the constitution's rule to preserve them until
resolution no longer prevents dependent research. Constitution v1.0.1 reconciles the historical references to unanswered questions and pending
tooling; no unresolved identity-isolation requirement is reintroduced.

The earlier identity-isolation gate was based on an overstrong recommendation and is withdrawn
with the user's approval. Native identity reuse is source-backed for both backends. Complete
remaining Phase 0 feasibility research before freezing Phase 1 contracts; runtime qualification
remains later acceptance work, not something documentation can claim to have passed. A failed
mandatory permission or data requirement still requires another candidate or an explicit user
scope decision, never silent weakening.

The [capability evidence matrix](qualification.md) distinguishes source-supported primitives from
runtime-qualified behavior. Both backends have plausible query building blocks, but neither is
qualified or demonstrated compatible with the full contract. The spec does not require generic
read-only membership. Private workspace protection remains mandatory. Finance permission-checking
code does not establish a product requirement and is not included in v1. No custom authorization
subsystem is selected or authorized by the research.

## Project Structure and Boundaries

Feature documents now include specification/checklist, this plan, research/capability evidence,
[data-model.md](data-model.md), [contracts/foundation.md](contracts/foundation.md), and
[quickstart.md](quickstart.md). The contract defines core behavior for review without claiming
a supported DXOS mapping. The guide separates existing tooling commands from future scenarios;
it does not invent runnable demo or conformance commands.

The intended logical boundaries are backend-neutral schema/query contracts and workflow
logic; independently distributed backend integrations; Svelte bindings; DUI presentation
compositions; and a separately hosted consumer demonstration/conformance harness. Concrete
package names, workspace layout, release entry points, and dependency versions remain release/
implementation prerequisites. Proposed distribution units are core, Svelte bindings, DUI
compositions, conformance checks, and separate plugins. No source directories are created.

## Phase 0: Qualification Work

1. Carry the pinned identity-source findings into design: Jazz maps a reused identity to
   separate app accounts, while DXOS joins devices to identity authority and existing spaces.
   Document credential/key scope, recovery, native discovery, and access consequences. Design
   explicit connection disclosure, distinguishing identity reuse from data sharing; do not claim organizational separation is a security boundary. Portable cross-app data sharing remains deferred from v1.
2. Produce a versioned evidence matrix for every mandatory capability. Separate documented
   support, source evidence, unknown behavior, and eventually executed results. Check generic
   null predicates, sorted bounded reactive results, CRUD, permissions, and offline durability.
3. Define scenarios for private workspace isolation and invited shared workspaces; document the
   selected backend's membership/access model. Exclude domain-restriction scenarios unless a
   separate consumer product requirement is explicitly approved.
4. Evaluate recovery and device linking, including cancellation, credential cleanup, offline
   availability, revocation limits, and app scope. Recovery and device joining are distinct.
5. Qualify optional transaction capabilities independently: atomic local persistence including
   crash/restart, and authority validation under conflict/unavailability. Record observation
   visibility separately. Absence does not fail baseline compliance but can fail app qualification.
6. Review documented findings before proposing any executable spike. Such code requires a
   new implementation instruction and user review before its implementation tests.

## Phase 1: Core Design Draft

- Define schema types, identifiers, references, validation, query comparison/order semantics,
  bounds, and schema evolution using the approved portable baseline. Do not design a domain-policy
  expression language unless a consumer requirement is explicitly approved.
- Define version compatibility, required capabilities, lifecycle, errors, observation cleanup,
  durability, later rejection, synchronization, and transaction contracts.
- Model XState startup/session/workspace/operation ownership, cancellation, late-result rejection,
  and cleanup without exposing actor access inside pure presentation components.
- Design consumer localization integration; audit DUI primitives and recommend only evidenced
  gaps. Local DUI 0.0.24 contains Dialog and Popover primitives; this is not accessibility
  qualification or a reason to duplicate them.
- Write the validation guide with real setup/run commands only when the design establishes
  what will exist. Same-backend identity reuse/access-disclosure scenarios require two app
  instances in addition to the two-backend deployment comparison; use separate ports and
  storage, and verify private workspace isolation and backend-native identity behavior. Add
  domain-policy scenarios only if separately approved as consumer requirements.
- Recheck constitution compliance, present the design for review, then generate tasks in a
  separate review cycle. Implementation authorization is still required afterward.

## Complexity Tracking

No constitutional exceptions are requested. The portable abstraction is user-approved, but
its implementation cost must not be disguised by backend-specific types leaking into consumers.

## Review Decisions in This Draft

- App-owned schemas use a proposed small scalar set with explicit nullability and typed references.
  Field/patch absence, timestamp representation, query comparison/sorting, ID tie-breakers,
  coverage, and result bounds are defined in the contract for review.
- Private workspace protection remains mandatory; shared-workspace membership roles follow the
  selected backend and are not normalized into required read-only/read-write levels. No Finance
  permission-checking behavior or domain-policy language is included in v1 absent a separately
  approved consumer requirement.
- XState owns lifecycle and scoped operations; plugins need not use XState internally. Session/
  workspace generations invalidate old observations, and UI cancellation does not imply rollback.
- Local durability and later remote settlement are independent. Runtime listeners survive closed
  forms; restart reconciliation reports unknown when native evidence is unavailable. No universal
  operation journal is required; online status proves neither acceptance nor synchronization.
- Pure DUI compositions receive props/callbacks and a typed message bundle built by consumer
  Paraglide functions. The foundation does not own global locale or app routing.
- The validation guide covers every success-criterion group, including fail-closed startup,
  private workspace protection, query parity, offline restart, optional transactions, identity reuse
disclosure, and accessible/localized interactions. Domain-policy scenarios are excluded unless an
additional consumer requirement is separately approved.

## Post-Design Constitution Review

The draft preserves independent distribution, strict TypeScript/no casts or switch in future
code, XState workflow ownership, domain separation, reusable presentation, local durability,
private workspace protection, explicit capabilities, and deferred cross-app data sharing. No new constitutional exception is
requested. Q1/Q2 use
user-approved answers. Constitution v1.0.1 reconciles the historical wording about decisions and tooling.

The design is reviewable but is not certified or implementation-ready. Mapping private workspace protection to DXOS, release version selection, precise migration
deployment, and remaining recovery/sync semantics must be settled in follow-up design before
dependent implementation tasks can claim those integrations are complete. Any later consumer-approved
domain restrictions require separate qualification. These open items do not
erase the core behavioral contract; unsupported required mappings fail qualification.

After review, continue those focused design tasks one at a time. Do not generate a checklist
that treats the remaining integration decisions as resolved, implement a backend workaround,
install application dependencies, or run implementation tests without the required authorization.

## Contract Consistency Review

See [design-review.md](design-review.md) for requirement coverage, corrected lifecycle/policy
ambiguities, and the remaining design work. The core remains a review draft, not an implemented
library or a certified DXOS mapping. The actual current branch is main; no feature branch was
created or checked out by this documentation review.

## UI Discovery Follow-up

[ui-discovery.md](ui-discovery.md) records source-observed recovery, device-linking, invitation,
sharing, and loading flows from Finance, Composer, and Jazz's Band Book example. DUI already
provides Dialog, Popover, StatusMessage, and FieldFeedback. Generic clipboard-copy feedback and
optional QR presentation are recommendations for later DUI review; no primitive is implemented
or assumed available. Foundation compositions own identity/workspace logic, native flow cleanup,
and authority disclosure. This is discovery evidence, not a live usability or accessibility pass.
