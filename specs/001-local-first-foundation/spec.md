# Feature Specification: Pluggable Local-First App Foundation

**Feature Branch**: Not created; initial specification on the repository's default branch.

**Created**: 2026-10-14

**Status**: Draft — requirements clarified for design review; backend feasibility and qualification remain unverified.

**Input**: Create a shared foundation for Delightful apps, informed by Finance and Clipper, with independently maintained local-first backend plugins, identity/workspace behavior, Svelte bindings, and DUI-based dialogs/popovers. Specify only; do not implement or migrate either app.

## Clarifications

### Session 2026-10-14

- Q: Should apps use a shared data interface across backends, or keep backend-specific schemas and queries? → A: Use a shared data interface (Option A), with a deliberately modest first version. Apps own their domain schemas; the foundation defines their portable expression and supported queries, subscriptions, and mutations, which plugins translate. Begin with concrete consumer needs and validate against two real backends before stabilizing the contract. The initial operation set and transaction guarantees remain to be clarified.
- Q: How much data querying should the first portable version support? → A: Practical baseline (Option B): typed records, explicit record-ID references, create/read/update/delete, equality and null checks, range filters, combined AND filters, field sorting, bounded result lists, and reactive observations. Related records use separate observations. Joins, aggregates, OR filters, pagination, and full-text search are deferred. Capabilities may be added later through versioned contract evolution and conformance checks; transaction guarantees remain a separate decision.
- Q: When an operation changes several records, what must every qualified backend guarantee? → A: Transactions are explicit optional capabilities (Option B), separating atomic local multi-record persistence from authority-validated transactions. Apps requiring either capability must reject plugins lacking it. Subscription visibility must be documented separately; local atomicity does not imply atomic remote observation or preservation of business invariants under concurrent offline changes. The user approved treating both transaction guarantees as optional capabilities rather than mandatory v1 baseline behavior on 2026-10-15.
- Q: Should users have separate identities for each Delightful app, or one identity they can use across apps? → A: Users may explicitly reuse one user identity across Delightful apps using the same backend. Shared identity does not by itself mean shared app data: app data stays organized in app-owned schemas/workspaces. The intended sharing model is an explicit workflow in which one app/workspace requests access to data from another app/workspace and the user approves or denies it; identity reuse alone grants no cross-workspace data access. This direction is confirmed by the user on 2026-10-15. The user decided on 2026-10-15 to defer the request-and-approval data-sharing flow from v1 until backend capabilities and portable authorization semantics are evaluated. V1 requires identity reuse and disclosure of backend-native access but does not promise cross-app data sharing. Before identity connection, the app must explain backend-specific identity authority and any native access that connecting grants. A future cross-app data-access request must explain the requested data and access before the user approves it. Private workspace data remains protected at the storage boundary; additional app-specific permission restrictions require explicit consumer approval before inclusion. Foundation-provided automatic single sign-on, a shared workspace directory, and identity portability between backend technologies remain outside v1. Cross-app data integration is not defined as a v1 requirement; backend-native discovery/access may exist and must be documented rather than assumed portable.

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

A user establishes an identity, resumes a session, recovers access, and links another device through reusable interactions provided by the foundation. Recovery and second-device linking are required foundation behaviors; each backend may provide its own flow. The user confirmed this scope on 2026-10-15.

**Why this priority**: Reusable account behavior must work before protected app data and shared workspaces can be used.

**Independent Test**: Exercise identity creation, session resumption, recovery, device linking, cancellation, and failure in a small consumer demonstration without Finance or Clipper domain data.

**Acceptance Scenarios**:

1. **Given** no active identity, **When** the user completes the selected backend's account flow, **Then** the app observes a usable identity and session or an actionable failure.
2. **Given** an existing local session, **When** the app restarts, **Then** it resumes through explicit startup states without accidentally creating another identity.
3. **Given** recovery or device linking is available, **When** the user completes the backend-native flow, **Then** they regain access to the intended identity and authorized workspaces.
4. **Given** an interrupted or cancelled identity operation, **When** the interaction ends, **Then** transient sensitive information is cleared and the user can retry without a false success state.
5. **Given** an identity established in one Delightful app, **When** the user explicitly connects another app using the same qualified backend, **Then** the existing identity is reused and the interaction explains the backend-native authority and workspace access granted by that connection.
6. **Given** two apps connected to the same identity, **When** the backend grants that identity access to existing spaces, **Then** qualification records that access and the apps keep domain data organized without claiming an app security boundary. Access to private workspaces remains denied to unrelated identities at the storage boundary.

### User Story 3 - Work privately and collaborate with controlled access (Priority: P1)

A user has a private personal workspace and can create or join shared workspaces. A consumer app may add its own domain-specific restrictions only when explicitly approved; no Finance-specific restriction is required by this feature.

**Why this priority**: Users need private personal data and a way to collaborate in shared workspaces; backend membership models may differ.

**Independent Test**: Use separate identities to demonstrate private workspace isolation and invited access to a shared workspace using the selected backend's documented membership model; generic read-only membership and app-specific domain restrictions are not required.

**Acceptance Scenarios**:

1. **Given** a personal workspace, **When** an unrelated identity attempts access, **Then** it cannot read or write its protected data.
2. **Given** a shared workspace invitation, **When** the intended recipient accepts it, **Then** they receive access according to the selected backend's documented membership model, which the foundation does not normalize into required read-only/read-write roles.
3. **Given** one app is connected to a shared identity, **When** it attempts to access another app's data, **Then** the foundation does not promise portable cross-app data sharing in v1; backend-native access is documented, not assumed.

### User Story 4 - Observe local data and operation states (Priority: P2)

An app developer defines domain schemas and accesses supported data through a shared interface translated by backend plugins, without backend-specific schemas, queries, or subscriptions in the portable app code. Users can distinguish startup, loading, empty results, ready data, and failures.

**Why this priority**: Portable data access and reusable reactive loading reduce backend coupling across apps; the first version must remain limited to agreed consumer needs.

**Independent Test**: Run the same app-defined schemas, record operations, and baseline filtered/sorted/bounded observations through both qualified backends; restart offline and reconnect without changing portable consumer data code. Separately qualify any declared transaction capabilities and verify rejection when an app requires an unsupported capability.

**Acceptance Scenarios**:

1. **Given** a requested observation, **When** it loads, has no matching results, or fails, **Then** the app can distinguish those outcomes.
2. **Given** an operation reported as locally durable, **When** the app restarts without a network connection, **Then** the acknowledged change remains available.
3. **Given** observations owned by a consumer, **When** the consumer is disposed or changes session/workspace, **Then** its obsolete subscriptions are released and do not publish another identity's data.
4. **Given** locally accepted changes and subsequent reconnection, **When** the backend synchronizes authorized data, **Then** the app can distinguish local success from synchronization status without treating network connectivity as proof of synchronization.
5. **Given** app-defined schemas and data operations within the agreed portable capability set, **When** the demonstration runs with either qualified backend, **Then** its schema declarations and consumer data access code remain unchanged; deployment configuration selects the plugin. This does not migrate existing data or identities.
6. **Given** typed records with ID references and a query combining workspace equality, a null check, a date range, field sorting, and a result bound, **When** records are created, updated, or deleted, **Then** the observation reflects the matching bounded results through both qualified backends. Related records can be observed separately without requiring joins.
7. **Given** a plugin declaring atomic local multi-record persistence, **When** a grouped write fails or the app restarts offline after local durability is acknowledged, **Then** the persisted result contains all of the group's changes or none, never a partial group.
8. **Given** an app requiring authority-validated transactions, **When** validation is unavailable or a concurrent conflict invalidates the operation, **Then** the operation remains explicitly pending or fails without reporting authority acceptance; an accepted operation meets the declared invariant-validation guarantee.
9. **Given** an app requiring either transaction capability, **When** its selected plugin lacks that capability, **Then** qualification fails before dependent operations execute.

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
- A future explicitly approved app-specific restriction is unsupported by a selected plugin; qualification must identify the gap rather than imply enforcement.
- A session/workspace changes while an observation or identity operation is pending.
- The device is offline during identity establishment, recovery, or invitation acceptance; unsupported offline operations must not report success.
- A local write fails before durability, or synchronization fails after local durability.
- An invitation expires, is rejected, or is accepted repeatedly; outcomes must be explicit without duplicate memberships.
- Workspace access changes while another device is offline. Qualification must document backend enforcement timing and revocation limits; it must not promise removal of data already disclosed.
- Required guarantees such as atomic multi-record changes differ between backends; these differences remain visible during qualification.
- Connecting another app may grant authority over spaces already accessible to the reused identity. The interaction must explain this consequence; app tags, separate views, and browser storage must not be presented as security isolation. Unauthorized identities must not access private workspaces; additional domain restrictions are in scope only if explicitly approved as consumer requirements.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The foundation MUST accept all database backends through a public plugin contract; backend-specific dependencies MUST belong to plugins rather than being mandatory foundation dependencies.
- **FR-002**: A plugin MUST be distributable and maintainable independently and usable without modifying foundation source code.
- **FR-003**: The contract MUST be versioned and define compatibility, capability declaration, startup/shutdown, cleanup, and actionable failure behavior. Concrete interfaces are deferred to design.
- **FR-004**: The foundation MUST validate compatibility and app-required capabilities before permitting dependent operations. Missing capabilities MUST NOT silently weaken authorization, durability, or other declared guarantees.
- **FR-005**: Plugin authors MUST have reusable conformance checks that distinguish contract compliance from qualification against an app's required capability set.
- **FR-006**: The foundation MUST support identity establishment, session lifecycle, recovery, and second-device linking, exposing their outcomes while permitting each backend to provide its native methods and interaction steps.
- **FR-007**: The foundation MUST support private personal workspaces and invited shared workspaces with explicit membership managed according to the selected backend's documented model. Private workspace data MUST be inaccessible to unrelated identities at the storage boundary.
- **FR-008**: Additional app-specific domain restrictions are outside the mandatory v1 foundation baseline. The foundation MAY support them through future design only when a consumer has an explicitly approved product requirement; any such restriction declared as required MUST be enforced at the backend/storage boundary, and UI filtering alone MUST NOT qualify. The foundation does not require generic read-only membership.
- **FR-009**: The foundation MUST provide observable startup, loading, ready, empty, and error outcomes and release obsolete observations when consumers, sessions, or workspaces change.
- **FR-010**: The foundation MUST define a shared data interface for app-owned domain schemas, queries, subscriptions, and mutations, translated by each backend plugin. Portable consumer data code MUST NOT require backend-specific schemas or APIs. The first version MUST be limited to concrete consumer needs and validated against two real backends before the contract is stabilized; it MUST NOT promise universal backend feature parity. FR-020 defines the mandatory data baseline; FR-022 defines optional transaction capabilities.
- **FR-011**: For operations advertised as locally durable, acknowledged changes MUST survive an offline restart. Local durability and later synchronization outcomes MUST remain distinguishable.
- **FR-012**: Users MUST be able to explicitly reuse one user identity across Delightful apps using the same qualified backend. Shared identity MUST NOT be represented as automatically sharing app data: each app owns its schemas/workspaces. V1 requires identity reuse without automatic cross-app data sharing. The user endorsed explicit app/workspace access requests with user approval as a future direction and deferred that workflow from v1 pending backend-capability evaluation. Plugins MUST document identity/account mapping, credential authority, native workspace/data discovery, and any access granted by identity reuse; the connection interaction MUST explain those consequences. Private workspaces MUST remain protected at the storage boundary. Foundation-provided automatic single sign-on, a shared workspace directory, and identity portability between backend technologies are outside v1. Backend-native discovery/access is documented but MUST NOT be implied portable.
- **FR-013**: The foundation MUST offer Svelte bindings and DUI-based account/recovery, device-linking, and workspace-membership dialogs/popovers; consumer apps MUST retain ownership of full screens, routes, layouts, and domain workflows.
- **FR-014**: Shared interactions MUST support keyboard operation, meaningful focus/dismissal behavior, consumer localization, and accessible operation feedback. Sensitive transient recovery/device information MUST be cleared when its interaction ends.
- **FR-015**: The project MUST document recommended missing DUI primitives, informed by observed consumer needs and other local-first apps. Recommendations MUST distinguish generic presentation from foundation-owned identity/workspace behavior and MUST NOT imply implementation in this phase.
- **FR-016**: Jazz and a real second backend MUST demonstrate the entire agreed required foundation capability set. A deterministic fake may support routine testing but MUST NOT substitute for the second real backend.
- **FR-017**: The second backend MUST pass qualification for identity/recovery/device linking, explicit cross-app identity reuse with documented backend-native access consequences, private/shared workspace behavior, private workspace protection, reactive observations, local durability, synchronization, and the mandatory portable data baseline. Additional app-specific restrictions are excluded from baseline qualification unless separately approved as consumer requirements. DXOS is the first candidate, not a committed selection. Any deficiency against a mandatory foundation capability MUST block qualification or prompt an explicit scope decision.
- **FR-018**: A deployment MUST select its plugin explicitly. Future validation MUST run the same consumer demonstration in two separate instances with separate ports and browser storage, each configured for one backend.
- **FR-019**: Plugin qualification MUST document offline availability, failure semantics, permission-change timing, and relevant capability limits. Other plugins need not be created or maintained by this project.
- **FR-020**: The mandatory v1 portable data baseline MUST support typed records, explicit record-ID references, create/read/update/delete, reactive observations, equality filters, null checks, range filters, combined AND filters, field sorting, and bounded result lists. Related records MUST be accessible through separate observations; portable joins are not required. A result bound MUST NOT imply pagination support.
- **FR-021**: Portable joins, aggregates, OR filters, pagination, and full-text search are deferred from v1. Future capabilities MAY be added through explicit versioned contract evolution and conformance checks. Apps MUST declare any newly required capabilities, and plugins lacking them MUST fail qualification rather than silently approximate their behavior. Promoting an optional capability to mandatory MUST be an explicit compatibility decision.
- **FR-022**: Multi-record transactions MUST be explicit optional capabilities, distinguishing (a) atomic local multi-record persistence, where a grouped write persists all changes or none and acknowledged local durability survives an offline restart, from (b) authority-validated transactions, where acceptance depends on validation of related reads and writes against concurrent conflicts at an authority. Authority unavailability MUST NOT be reported as acceptance. Neither capability implies the other. Apps MUST declare the capabilities they require; unsupported requirements MUST block qualification and dependent operations. Plugins MUST document subscription visibility separately, including whether other devices can observe partial groups; local atomicity MUST NOT imply atomic remote visibility or preservation of cross-record business invariants under concurrent offline changes. Each declared capability MUST have reusable conformance checks; the mandatory v1 baseline does not require either transaction capability.

- **Key Entities** _(include if feature involves data)_

- **Backend plugin**: Independently maintained integration with a particular local-first backend, its compatibility version, and supported capabilities.
- **Capability requirement**: A behavior or guarantee required by a consumer; determines whether a compatible plugin is suitable for that app.
- **Identity and session**: A backend-managed user identity reusable by explicit connection across apps using the same backend, with backend-native credential authority and workspace access. A backend may assign separate app accounts to one identity; shared authority does not imply security isolation between apps.
- **Workspace**: A personal or shared boundary for protected app data, independent of Finance's financial accounts.
- **Membership and invitation**: Granted workspace access and the process by which another identity accepts access.
- **Permission extension**: A possible future app-specific authorization restriction, included only after an explicit consumer product requirement is approved.
- **Portable domain schema and data operation**: An app-owned typed record model with explicit record-ID references, and its baseline queries, subscriptions, and mutations expressed through the foundation's shared interface and translated by plugins; multi-record transactions are separately declared optional capabilities.
- **Observation and operation outcome**: Consumer-visible data readiness, errors, durability, and synchronization information across qualified backend implementations.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An independently distributed plugin can be integrated into the demonstration with zero edits to foundation source code.
- **SC-002**: Two real backends pass every scenario for the agreed mandatory foundation capabilities; differences and optional capabilities are explicitly recorded.
- **SC-003**: Every incompatible version or missing app-required capability in the qualification scenarios produces an actionable failure before the unsupported operation executes.
- **SC-004**: Identity creation/resumption, recovery, and linking a second device succeed through both qualified backends, with cancellation and failure cases producing no false success.
- **SC-005**: Unauthorized identities cannot access private workspace data at the storage boundary in every qualified scenario. Additional domain-denial scenarios apply only when an app-specific restriction is explicitly approved; no generic read-only membership behavior is assumed.
- **SC-006**: Every write acknowledged as locally durable in the qualification scenarios remains available after an offline restart.
- **SC-007**: Consumers distinguish loading, empty, ready, and error results; disposed observations produce no further consumer updates.
- **SC-008**: All required shared interactions can be embedded without adopting a foundation-owned screen or router and can be completed with keyboard input.
- **SC-009**: The demonstration uses identical portable domain schema declarations and consumer data access code with both qualified backends for every agreed required data scenario, without per-app backend adapters for those scenarios.

- **SC-010**: Every declared transaction capability passes its conformance scenarios, including failure/conflict handling and offline restart for atomic local persistence. Every scenario requiring an absent transaction capability fails qualification before dependent operations execute. Subscription visibility limits are recorded separately.
- **SC-011**: With each qualified backend, two consumer app instances in separate browser storage can explicitly connect to the same user identity. The connection interaction explains the authority granted. Shared identity alone does not imply shared app data. Cross-app data sharing is deferred from v1. If considered later, it requires an explicit request from the requesting app/workspace and user approval of the requested data/access; denied or unrequested access must not be granted. Unauthorized identities cannot access private workspaces.

These are future implementation acceptance criteria, not claims that this specification-only phase has exercised or satisfied them. Optional transaction capabilities are qualified separately from the mandatory baseline; an app's required capability set remains authoritative.

## Assumptions

- Primary audiences are app developers, independent plugin authors, and end users interacting with foundation-provided account/workspace compositions.
- Finance and Clipper are reference consumers, not the only intended apps. Finance's money, ledgers, categories, and grants remain app-domain concepts; no Finance permission-checking code is automatically adopted as a product requirement. Clipper's articles, books, reading state, and capture workflows remain app-domain concepts.
- All backends, including Jazz, are plugins. The foundation does not promise to author or maintain every plugin, and third-party plugin compliance is distinct from project endorsement or maintenance.
- DUI is the shared presentation library. Foundation compositions may depend on DUI and Svelte; exact package boundaries and dependency rules belong to later design.
- DXOS will be evaluated first for the second backend. Its current suitability must be checked before selection; no equivalent identity, permissions, transactions, or storage behavior is assumed.
- Plugin selection is deployment-level. Runtime installation, a marketplace, user-selectable backends, and migration of existing identities/data between backends are excluded initially.
- Binary-storage abstraction and app-specific file replication/download policies are deferred. This draft makes no promise of file parity.
- Clipper starts fresh if later revived. Legacy Webnative/Fission recovery/import, Clipper restoration, and Finance migration are outside this feature.
- This phase creates a local repository and Spec Kit specification/checklist only: no library/app code, consumer changes, tests, commits, or GitHub publishing.
- Q1 and Q2 are resolved at the requirements level: the practical portable data baseline and optional transaction capabilities are defined in FR-020/FR-022, and explicit identity reuse with backend-native access behavior is defined in FR-012. Concrete interfaces and conformance design belong to later design. Source investigation establishes native identity reuse paths, not full backend qualification. Universal isolation between apps sharing identity authority is not a requirement; all other required permissions and guarantees still need qualification.

## Reference Evidence and Follow-up

- Finance's `jazz-session.ts`, `WorkspaceBootstrap.svelte`, `QueryContent.svelte`, and identity setup provide extraction evidence. Existing permission-checking code is reference material only, not an approved user-facing requirement; reuse patterns, not finance-specific assumptions.
- Clipper's legacy Webnative integration couples identity, metadata, and file storage. It motivates replaceability without bringing binary storage or unrelated access-control assumptions into this spec.
- [Backend source investigation](research.md) records pinned Jazz and DXOS identity/access findings. DXOS remains the first second-backend candidate; neither source analysis nor documentation review constitutes full qualification.
- Later UI discovery should review account recovery, device linking, collaboration, and loading behavior in local-first apps, including DXOS Composer. Recommendations must cite the observed behavior and state whether it belongs in DUI or this foundation; that discovery is not an app implementation commitment.
