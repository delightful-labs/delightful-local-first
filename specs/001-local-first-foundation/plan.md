# Technical Plan: Pluggable Local-First App Foundation

**Branch**: `001-local-first-foundation` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Status**: Source-backed identity research recorded; app-isolation blocker withdrawn after user-approved requirement correction. Remaining feasibility research and Phase 1 design are pending.

## Summary

Design a portable, typed data foundation with independently distributed backend plugins,
XState workflows, Svelte bindings, and DUI identity/workspace compositions. The approved
baseline includes CRUD, ID references, reactive observations, equality/null/range/AND
filters, sorting, and bounded lists. Transactions are separately declared optional
capabilities. Identity reuse follows documented backend-native authority and access behavior;
workspace membership and app-required domain grants remain storage-enforced.

No foundation, plugin, demonstration, migration, or implementation tests are authorized in
this phase. This plan records research and the next qualification work; it is not a completed
implementation design. See [research.md](research.md) for evidence and blockers.

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
  SSO, foundation-wide workspace directory, or cross-app data integration in v1. Backend-native
  space discovery and access remain permitted.
- **Performance**: no numeric SLA is approved. Qualification must record query workload,
  local data availability, execution limits, and timing without inventing parity claims.

## Constitution Check

| Gate                                                                            | Result                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Independently distributable backends, no mandatory backend dependencies in core | Required design boundary; no implementation claim                   |
| Strict typing and explicit XState lifecycle/cleanup                             | Required; implementation checks remain pending                      |
| Domain behavior outside foundation; DUI owns generic presentation               | Preserved                                                           |
| Portable v1 data contract and optional transactions                             | Requirements resolved; remaining semantics need design/research     |
| Reused identity with documented native access consequences                      | Source paths identified; no universal app-isolation gate            |
| Workspace membership and app-required domain permissions                        | Mandatory; enforcement still requires qualification                 |
| Two real backends meet mandatory requirements                                   | Future acceptance gate; not a prerequisite to designing conformance |
| Specification-only scope, incremental review, approval before tests             | Satisfied by documentation-only work                                |

Q1/Q2 were resolved explicitly by the user; the constitution's rule to preserve them until
resolution no longer prevents dependent research. Historical constitution references to
unanswered questions and pending tooling need a separately reviewed documentation amendment,
not an assumed change in governing requirements.

The earlier identity-isolation gate was based on an overstrong recommendation and is withdrawn
with the user's approval. Native identity reuse is source-backed for both backends. Complete
remaining Phase 0 feasibility research before freezing Phase 1 contracts; runtime qualification
remains later acceptance work, not something documentation can claim to have passed. A failed
mandatory permission or data requirement still requires another candidate or an explicit user
scope decision, never silent weakening.

## Project Structure and Boundaries

Existing feature documents: specification, quality checklist, this plan, and research.
Phase 1 would add `data-model.md`, `contracts/`, and `quickstart.md` after its entry gate passes.
Do not create placeholder contracts or runnable commands for unimplemented software.

The intended logical boundaries are backend-neutral schema/query contracts and workflow
logic; independently distributed backend integrations; Svelte bindings; DUI presentation
compositions; and a separately hosted consumer demonstration/conformance harness. Concrete
package names, workspace layout, published entry points, and dependency versions are deferred
until feasibility is established. No source directories are created by this task.

## Phase 0: Qualification Work

1. Carry the pinned identity-source findings into design: Jazz maps a reused identity to
   separate app accounts, while DXOS joins devices to identity authority and existing spaces.
   Document credential/key scope, recovery, native discovery, and access consequences. Design
   explicit connection disclosure; do not claim organizational separation is a security boundary.
2. Produce a versioned evidence matrix for every mandatory capability. Separate documented
   support, source evidence, unknown behavior, and eventually executed results. Check generic
   null predicates, sorted bounded reactive results, CRUD, permissions, and offline durability.
3. Define permission scenarios using private/shared workspaces, read-only access, and an
   app-defined selected-record grant. Verify the restriction applies below the UI.
4. Evaluate recovery and device linking, including cancellation, credential cleanup, offline
   availability, revocation limits, and app scope. Recovery and device joining are distinct.
5. Qualify optional transaction capabilities independently: atomic local persistence including
   crash/restart, and authority validation under conflict/unavailability. Record observation
   visibility separately. Absence does not fail baseline compliance but can fail app qualification.
6. Review documented findings before proposing any executable spike. Such code requires a
   new implementation instruction and user review before its implementation tests.

## Phase 1: Design After Gate Resolution

- Define schema types, identifiers, references, validation, query comparison/order semantics,
  bounds, schema evolution, and permission policy expression using the qualified common behavior.
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
  storage, and verify native access behavior plus required membership/domain denials.
- Recheck constitution compliance, present the design for review, then generate tasks in a
  separate review cycle. Implementation authorization is still required afterward.

## Complexity Tracking

No constitutional exceptions are requested. The portable abstraction is user-approved, but
its implementation cost must not be disguised by backend-specific types leaking into consumers.
