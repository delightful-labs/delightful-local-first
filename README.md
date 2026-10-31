# Delightful Local First

Shared local-first app foundation using Jazz for v1, informed by Delightful Finance and Delightful UI. Focused SDK boundaries leave room for future backend replacement.

This repository contains the MVP specification, developer tooling, and the initial recovery workflow. Shared UI, a Jazz adapter, the demonstration app, and Finance adoption remain future work.

- [Foundation specification](specs/001-local-first-foundation/spec.md)
- [Specification quality checklist](specs/001-local-first-foundation/checklists/requirements.md)

The [recovery first-slice plan](specs/001-local-first-foundation/plan.md) guides incremental adoption in Finance. A second backend, portable schemas, and independent plugins are deferred.

## Spec Kit

The repository is bootstrapped from the existing local Spec Kit 1.1.3 scaffold because the `specify` CLI is not installed. Templates, shell scripts, workflows, and Codex skills are included. No extension hooks are installed. `.specify/feature.json` identifies the active feature independently of the Git branch.

The [project constitution](.specify/memory/constitution.md) is adopted, with governance adapted from Finance and explicit backend integration boundaries.

Use the local Spec Kit skills for later focused planning. The recovery plan replaces the old multi-backend design for this slice.

## Tooling

Use Node.js 22.17+ on the 22.x line, or Node.js 24+ and pnpm 10.22.0. Run `pnpm install --frozen-lockfile` to install the pinned development tools.

- `pnpm format` formats repository-owned files with Oxfmt.
- `pnpm format:check` checks formatting without writing files.
- `pnpm lint` runs Oxlint with correctness errors, explicit `any` prohibited, and type casts prohibited.

Inherited Spec Kit scripts, templates, and skills are excluded from formatting and linting. Avoid formatting unrelated files when making changes; use `pnpm exec oxfmt <paths>` for a focused change.

`pnpm check` runs strict Svelte and TypeScript checks. `pnpm package` builds the private package
and validates it with publint; run `pnpm check:consumer` afterwards to check built public exports.
`pnpm test:unit --run` runs the approved machine unit coverage.
`pnpm verify` runs static checks, unit tests, packaging, consumer checks, and Storybook in CI order.
See [developer tooling](docs/development.md) for import boundaries, editor setup, limitations,
and dependency update/PR conventions. The root package entry remains empty; recovery uses separate exports.

The recovery workflow uses XState. SvelteKit hosting, Jazz integration, DUI compositions, and
consumer adoption remain separately scoped implementation work.
Current unit coverage uses synthetic recovery data; the implementation-review gate still applies to
new behavior and its tests. No browser suite is configured yet.

## Storybook and Netlify

- `pnpm storybook` starts the local workbench at `http://127.0.0.1:6006` with an exact port.
- `pnpm build-storybook` builds static documentation into `storybook-static/`.

The initial Introduction page documents ownership and project status. Add reviewed component stories
under `stories/` as library components are implemented. The workbench has a dedicated Vite config,
so a future SvelteKit app does not implicitly change its build. Storybook telemetry is disabled.

`netlify.toml` builds and hosts the static Storybook with Node 24 and the pinned pnpm version.
It does not deploy Jazz schemas or require Finance credentials. Connecting this repository to a
Netlify site is a separate hosting action; no site is created or published by this tooling change.

## GitHub CI

The `CI` workflow runs on pull requests, pushes to `main`, and manual dispatch. It installs the frozen
lockfile, checks formatting, lint and types, runs unit coverage, validates the package and consumer fixture, then builds Storybook. Permissions are read-only and superseded
runs are cancelled. No deployment secrets are required. Branch protection and required checks must be
configured separately after the workflow is available remotely.

New unit/browser coverage is added only after implementation review. Current unit coverage verifies
the recovery workflow, not Jazz integration or UI behavior. A separate workflow checks Conventional
Commits PR titles.
