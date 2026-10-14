# Delightful Local First

Shared local-first app foundation with independently maintained backend plugins, informed by Delightful Finance and Delightful Clipper.

This repository currently contains a draft specification only. No library, adapters, demonstration app, or tests have been implemented.

- [Foundation specification](specs/001-local-first-foundation/spec.md)
- [Specification quality checklist](specs/001-local-first-foundation/checklists/requirements.md)

The next step is to clarify the shared data boundary and cross-app identity. Jazz and a second qualified backend will validate the eventual plugin contract; DXOS is the first candidate, not a selected dependency.

## Spec Kit

The repository is bootstrapped from the existing local Spec Kit 1.1.3 scaffold because the `specify` CLI is not installed. Templates, shell scripts, workflows, and Codex skills are included. No extension hooks are installed. `.specify/feature.json` identifies the active feature independently of the Git branch.

The [project constitution](.specify/memory/constitution.md) is adopted, with governance adapted from Finance and plugin-independent foundation principles.

Use the local `speckit-clarify` skill to refine the draft, then create a technical plan when the requirements are ready. Backend qualification and DUI gap recommendations remain future feature work.

## Tooling

Use Node.js 22.12 or newer and pnpm 10.22.0. Run `pnpm install --frozen-lockfile` to install the pinned development tools.

- `pnpm format` formats repository-owned files with Oxfmt.
- `pnpm format:check` checks formatting without writing files.
- `pnpm lint` runs Oxlint with correctness errors, explicit `any` prohibited, and type casts prohibited.

Inherited Spec Kit scripts, templates, and skills are excluded from formatting and linting. Avoid formatting unrelated files when making changes; use `pnpm exec oxfmt <paths>` for a focused change.

There is no application code yet, so linting currently has no source files to inspect and permits an empty file set. Oxlint checks Svelte script blocks, but does not provide Svelte template linting. Strict TypeScript/Svelte checking and full enforcement of the no-assertion and no-switch conventions must be completed before application implementation; the current lint command is not a complete constitution compliance check. See [Oxc compatibility](https://oxc.rs/compatibility).

XState, SvelteKit, and other application dependencies will be installed with their separately authorized implementation tasks. No application tests or development server are configured in this specification-only phase.
