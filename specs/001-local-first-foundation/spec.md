# Feature Specification: Pluggable Local-First App Foundation

**Feature Branch**: Not created; initial specification on the repository's default branch.

**Created**: 2026-10-14

**Status**: Draft — discussion-ready; two requirements remain explicitly unresolved.

**Input**: Create a shared foundation for Delightful apps, informed by Finance and Clipper, with independently maintained local-first backend plugins, identity/workspace behavior, Svelte bindings, and DUI-based dialogs/popovers. Specify only; do not implement or migrate either app.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Integrate an independently maintained backend (Priority: P1)

An app developer selects a backend plugin for a deployment. A plugin author can distribute and maintain that plugin independently, without modifying the foundation or making the foundation depend on every supported database.

**Why this priority**: Database replaceability and independent maintenance are the reason for creating this foundation.

**Independent Test**: Register a separately distributed plugin with a consumer demonstration and evaluate its compatibility and declared capabilities using the shared conformance suite.

**Acceptance Scenarios**:

1. **Given** a compatible independently distributed plugin, **When** a developer configures a deployment to use it, **Then** the foundation uses it without changes to foundation source code.
2. **Given** a plugin with an incompatible contract version or a missing required capability, **When** the app initializes, **Then** it reports the incompatibility and prevents operations requiring that capability rather than weakening their guarantees.
3. **Given** a plugin author, **When** they run the reusable conformance checks, **Then** they receive results distinguishing contract compliance from support for the capabilities required by a particular app.
4. **Given** Jazz and a qualified second backend, **When** the same demonstration runs in two isolated instances, **Then** both satisfy the same agreed foundation scenarios with backend-native identity methods where appropriate.

### User Story 2 - Establish and recover a local-first identity (Priority: P1)

A user establishes an identity, resumes a session, recovers access, and links another device through reusable interactions provided by the foundation.

**Why this priority**: Reusable account behavior must work before protected app data and shared workspaces can be used.

**Independent Test**: Exercise identity creation, session resumption, recovery, device linking, cancellation, and failure in a small consumer demonstration without Finance or Clipper domain data.

**Acceptance Scenarios**:

1. **Given** no active identity, **When** the user completes the selected backend's account flow, **Then** the app observes a usable identity and session or an actionable failure.
2. **Given** an existing local session, **When** the app restarts, **Then** it resumes through explicit startup states without accidentally creating another identity.
3. **Given** recovery or device linking is available, **When** the user completes the backend-native flow, **Then** they regain access to the intended identity and authorized workspaces.
4. **Given** an interrupted or cancelled identity operation, **When** the interaction ends, **Then** transient sensitive information is cleared and the user can retry without a false success state.

### User Story 3 - Work privately and collaborate with controlled access (Priority: P1)

A user has a private personal workspace and can create or join shared workspaces with explicit read/write membership. An app developer can add domain-specific restrictions, such as Finance's selected-ledger access.

**Why this priority**: Sharing and app-specific authorization must remain meaningful across plugins.

**Independent Test**: Use separate identities to demonstrate private isolation, an invitation, read-only membership, write membership, and an app-defined restriction at the storage boundary.

**Acceptance Scenarios**:

1. **Given** a personal workspace, **When** an unrelated identity attempts access, **Then** it cannot read or write its protected data.
2. **Given** a shared workspace invitation, **When** the intended recipient accepts it, **Then** they receive only the access granted by the workspace's membership policy.
3. **Given** read-only membership, **When** the user attempts a write directly through data access, **Then** the storage boundary rejects it.
4. **Given** an app-specific permission extension, **When** a user attempts an operation outside their grant, **Then** the plugin enforces the restriction independently of UI visibility.
5. **Given** a backend cannot enforce the app's required restrictions, **When** it is qualified for that app, **Then** qualification fails with the unsupported requirement identified.

### User Story 4 - Observe local data and operation states (Priority: P2)

An app developer integrates observable loading and operation states without exposing backend-specific subscriptions throughout the app. Users can distinguish startup, loading, empty results, ready data, and failures.

**Why this priority**: Finance demonstrates the need for reusable reactive loading; the exact data boundary needs further discussion before implementation.

**Independent Test**: Once clarification Q1 is resolved, observe representative app-defined records, perform local changes, restart offline, and reconnect using the agreed shared data boundary.

**Acceptance Scenarios**:

1. **Given** a requested observation, **When** it loads, has no matching results, or fails, **Then** the app can distinguish those outcomes.
2. **Given** an operation reported as locally durable, **When** the app restarts without a network connection, **Then** the acknowledged change remains available.
3. **Given** observations owned by a consumer, **When** the consumer is disposed or changes session/workspace, **Then** its obsolete subscriptions are released and do not publish another identity's data.
4. **Given** locally accepted changes and subsequent reconnection, **When** the backend synchronizes authorized data, **Then** the app can distinguish local success from synchronization status without treating network connectivity as proof of synchronization.

### User Story 5 - Compose shared interactions without adopting full screens (Priority: P2)

An app developer composes account/recovery, device-linking, and workspace-membership dialogs or popovers using the shared UI library, while retaining their own navigation, layout, screens, and domain workflows.

**Why this priority**: Shared interactions should reduce repeated app code without imposing a complete application shell.

**Independent Test**: Embed the interactions in a minimal consumer and exercise keyboard use, dismissal, translated content, state feedback, and backend-native flows.

**Acceptance Scenarios**:

1. **Given** a consumer using DUI, **When** it presents a foundation interaction, **Then** the interaction integrates with its screen without requiring foundation-owned routing or layout.
2. **Given** loading, failure, cancellation, or completion, **When** the interaction changes state, **Then** it provides accessible feedback and appropriate focus behavior without duplicate announcements.
3. **Given** a missing reusable UI primitive, **When** the interaction requirements are evaluated, **Then** a recommendation identifies the behavior, evidence, and proposed ownership rather than assuming an unavailable DUI API.

### Edge Cases

- Backend startup fails, is cancelled, or is requested more than once.
- Contract versions are incompatible or declared capabilities fail conformance checks.
- A plugin supports workspace roles but cannot enforce an app-specific restriction.
- A session/workspace changes while an observation or identity operation is pending.
- The device is offline during identity establishment, recovery, or invitation acceptance; unsupported offline operations must not report success.
- A local write fails before durability, or synchronization fails after local durability.
- An invitation expires, is rejected, or is accepted repeatedly; outcomes must be explicit without duplicate memberships.
- Membership changes while another device is offline. Qualification must document enforcement timing and the limits of revocation; it must not promise removal of data already disclosed.
- Required guarantees such as atomic multi-record changes differ between backends; these differences remain visible during qualification.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The foundation MUST accept all database backends through a public plugin contract; backend-specific dependencies MUST belong to plugins rather than being mandatory foundation dependencies.
- **FR-002**: A plugin MUST be distributable and maintainable independently and usable without modifying foundation source code.
- **FR-003**: The contract MUST be versioned and define compatibility, capability declaration, startup/shutdown, cleanup, and actionable failure behavior. Concrete interfaces are deferred to design.
- **FR-004**: The foundation MUST validate compatibility and app-required capabilities before permitting dependent operations. Missing capabilities MUST NOT silently weaken authorization, durability, or other declared guarantees.
- **FR-005**: Plugin authors MUST have reusable conformance checks that distinguish contract compliance from qualification against an app's required capability set.
- **FR-006**: The foundation MUST expose identity establishment, session lifecycle, recovery, and device-linking outcomes while permitting backend-native methods and steps.
- **FR-007**: The foundation MUST support private personal workspaces and invited shared workspaces with explicit read/write membership.
- **FR-008**: App developers MUST be able to extend authorization with domain-specific restrictions enforced at the backend/storage boundary. UI filtering alone MUST NOT qualify as enforcement.
- **FR-009**: The foundation MUST provide observable startup, loading, ready, empty, and error outcomes and release obsolete observations when consumers, sessions, or workspaces change.
- **FR-010**: The shared data boundary is [NEEDS CLARIFICATION: Q1 — decide how app-defined schemas, queries, subscriptions, mutations, and multi-record operations cross the plugin boundary; determine mandatory capabilities versus optional capabilities before defining APIs or promising parity].
- **FR-011**: For operations advertised as locally durable, acknowledged changes MUST survive an offline restart. Local durability and later synchronization outcomes MUST remain distinguishable.
- **FR-012**: Whether identities are shared between Delightful apps is [NEEDS CLARIFICATION: Q2 — choose separate app identities or shared cross-app identity, including isolation expectations; reusable account behavior does not by itself establish single sign-on].
- **FR-013**: The foundation MUST offer Svelte bindings and DUI-based account/recovery, device-linking, and workspace-membership dialogs/popovers; consumer apps MUST retain ownership of full screens, routes, layouts, and domain workflows.
- **FR-014**: Shared interactions MUST support keyboard operation, meaningful focus/dismissal behavior, consumer localization, and accessible operation feedback. Sensitive transient recovery/device information MUST be cleared when its interaction ends.
- **FR-015**: The project MUST document recommended missing DUI primitives, informed by observed consumer needs and other local-first apps. Recommendations MUST distinguish generic presentation from foundation-owned identity/workspace behavior and MUST NOT imply implementation in this phase.
- **FR-016**: Jazz and a real second backend MUST demonstrate the entire agreed required foundation capability set. A deterministic fake may support routine testing but MUST NOT substitute for the second real backend.
- **FR-017**: The second backend MUST pass qualification for identity/recovery/device linking, workspace roles, extensible permissions, reactive observations, local durability, synchronization, and the data guarantees settled by Q1. DXOS is the first candidate, not a committed selection. Any deficiency MUST block qualification or prompt an explicit scope decision.
- **FR-018**: A deployment MUST select its plugin explicitly. Future validation MUST run the same consumer demonstration in two separate instances with separate ports and browser storage, each configured for one backend.
- **FR-019**: Plugin qualification MUST document offline availability, failure semantics, permission-change timing, and relevant capability limits. Other plugins need not be created or maintained by this project.

### Key Entities _(include if feature involves data)_

- **Backend plugin**: Independently maintained integration with a particular local-first backend, its compatibility version, and supported capabilities.
- **Capability requirement**: A behavior or guarantee required by a consumer; determines whether a compatible plugin is suitable for that app.
- **Identity and session**: A backend-managed user identity and the current application's access lifecycle. Cross-app identity remains unresolved.
- **Workspace**: A personal or shared boundary for protected app data, independent of Finance's financial accounts.
- **Membership and invitation**: Granted workspace access and the process by which another identity accepts access.
- **Permission extension**: App-specific authorization beyond baseline workspace read/write membership.
- **Observation and operation outcome**: Consumer-visible data readiness, errors, durability, and synchronization information; the exact data model remains unresolved.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An independently distributed plugin can be integrated into the demonstration with zero edits to foundation source code.
- **SC-002**: Two real backends pass every scenario for the agreed mandatory foundation capabilities; differences and optional capabilities are explicitly recorded.
- **SC-003**: Every incompatible version or missing app-required capability in the qualification scenarios produces an actionable failure before the unsupported operation executes.
- **SC-004**: Identity creation/resumption, recovery, and linking a second device succeed through both qualified backends, with cancellation and failure cases producing no false success.
- **SC-005**: All private-workspace, read-only-write, and app-specific permission denial scenarios are enforced through direct data access as well as through the UI.
- **SC-006**: Every write acknowledged as locally durable in the qualification scenarios remains available after an offline restart.
- **SC-007**: Consumers distinguish loading, empty, ready, and error results; disposed observations produce no further consumer updates.
- **SC-008**: All required shared interactions can be embedded without adopting a foundation-owned screen or router and can be completed with keyboard input.

These are future implementation acceptance criteria, not claims that this specification-only phase has exercised or satisfied them. Data-related criteria must be refined after Q1 is answered.

## Assumptions

- Primary audiences are app developers, independent plugin authors, and end users interacting with foundation-provided account/workspace compositions.
- Finance and Clipper are reference consumers, not the only intended apps. Finance's money, ledgers, categories, and grants remain app-domain concepts; Clipper's articles, books, reading state, and capture workflows remain app-domain concepts.
- All backends, including Jazz, are plugins. The foundation does not promise to author or maintain every plugin, and third-party plugin compliance is distinct from project endorsement or maintenance.
- DUI is the shared presentation library. Foundation compositions may depend on DUI and Svelte; exact package boundaries and dependency rules belong to later design.
- DXOS will be evaluated first for the second backend. Its current suitability must be checked before selection; no equivalent identity, permissions, transactions, or storage behavior is assumed.
- Plugin selection is deployment-level. Runtime installation, a marketplace, user-selectable backends, and migration of existing identities/data between backends are excluded initially.
- Binary-storage abstraction and app-specific file replication/download policies are deferred. This draft makes no promise of file parity.
- Clipper starts fresh if later revived. Legacy Webnative/Fission recovery/import, Clipper restoration, and Finance migration are outside this feature.
- This phase creates a local repository and Spec Kit specification/checklist only: no library/app code, consumer changes, tests, commits, or GitHub publishing.
- Q1 and Q2 intentionally remain open at the user's request. This draft is ready for clarification, not implementation planning.

## Reference Evidence and Follow-up

- Finance's `jazz-session.ts`, `WorkspaceBootstrap.svelte`, `QueryContent.svelte`, identity schema, and permissions provide extraction evidence; reuse patterns, not finance-specific assumptions.
- Clipper's legacy Webnative integration couples identity, metadata, and file storage. It motivates replaceability without bringing binary storage or reader features into this spec.
- [DXOS documentation](https://dxos.org/docs/) is the starting point for qualification. No second-backend selection or technical feasibility result has been produced in this phase.
- Later UI discovery should review account recovery, device linking, collaboration, and loading behavior in local-first apps, including DXOS Composer. Recommendations must cite the observed behavior and state whether it belongs in DUI or this foundation; that discovery is not an app implementation commitment.
