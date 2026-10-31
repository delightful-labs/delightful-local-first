# Developer tooling

This setup validates build and package infrastructure. The package entry point is intentionally
empty; it implements no foundation API. No Jazz, XState, DUI, or consumer migration is introduced.
The package remains private and no release/publish workflow is configured.

## Static checks

Use the Node 24 line in `.node-version` and pnpm 10.22.0 from `package.json`.
Install with `pnpm install --frozen-lockfile`, then run `pnpm verify` for the CI checks locally.

- `pnpm format:check`: repository Oxfmt formatting.
- `pnpm lint`: Oxlint correctness, no explicit any/casts, and import-boundary restrictions.
- `pnpm check`: strict Svelte diagnostics and TypeScript/JavaScript checks, including configs.
- `pnpm package`: generate `dist` JavaScript/declarations with svelte-package and run strict publint.
- `pnpm check:consumer`: after packaging, resolve declarations with NodeNext and import built ESM
  through the public package name. No source path mapping is used.
- `pnpm build-storybook`: static documentation build.

The consumer fixture uses package self-reference and generated `dist` exports. It catches missing
entry points and declaration resolution problems; it is not yet an isolated installed-tarball or
component rendering check. Publint separately inspects package metadata and publishable files.
Extend the fixture to real public APIs in the focused implementation that introduces those APIs.

TypeScript is strict with unchecked indexed access and exact optional properties. Dependency type
internals are skipped in the main check; owned files are checked. The package consumer enables
dependency declaration checking so broken emitted type references are not hidden. Svelte diagnostics fail on warnings. Oxlint does not
provide full Svelte template linting; compiler diagnostics and type checks complement its script
checks. Machine ownership and cleanup still need review; static checks cannot establish runtime
correctness. No-switch enforcement remains a review rule, not a claim made by this lint configuration.

## Import boundaries

| Location                     | Responsibility                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/lib/backend/jazz/`      | Only library source allowed to import Jazz directly; SDK schema/policy mappings and leaf operations    |
| `src/lib/machines/`          | Reusable typed workflows consuming backend boundaries                                                  |
| `src/lib/integrations/`      | Dependency binding, subscriptions, actor attachment, and composition                                   |
| `src/lib/components/`        | Pure presentation, data/view models and callbacks; no XState, machine, backend, or integration imports |
| `fixtures/package-consumer/` | Built public-package resolution checks, not library source                                             |

Oxlint checks static imports/re-exports and literal dynamic imports, including type imports. The
Finance package/path names are prohibited throughout the repo. The only Jazz exception is the
backend directory, and pure components additionally reject actor packages and orchestration paths.
Types needed by views should be exposed through focused actor-free contracts rather than machine
files. New aliases and barrel re-exports must preserve these boundaries during review: this is
specifier-based enforcement, not a transitive dependency graph analysis. Computed dynamic imports
are outside the check and must not be used to bypass it.

The directory names establish tooling conventions, not a settled runtime design or permission to
implement it. Host-owned resources and independently adoptable entry points still require the
revised technical plan.

## Editor setup

`.editorconfig` supplies tabs, UTF-8, LF endings, and final newlines; Markdown/YAML use spaces.
`.vscode/extensions.json` recommends Svelte, Oxc, and EditorConfig extensions without forcing
editor-wide settings. The repository formatter configuration remains authoritative.

## Pull requests and dependencies

Use Conventional Commits titles: `type(scope): description`, with optional scope and `!` for a
breaking change. The PR-title workflow checks the event payload without interpolating PR text
into shell commands. The PR template captures behavior, ownership, validation, and test approval.
It does not replace the user review required before implementation tests are added or run.

Dependabot checks npm/pnpm dependencies and GitHub Actions weekly. Storybook updates are grouped;
minor/patch Svelte toolchain and development-tool updates are grouped separately. Other major
updates remain individual except the deliberately coordinated Storybook group. No auto-merge is
configured. The rules take effect after merge to the default branch; existing alerts/security
update settings and required branch checks are GitHub repository settings, not changed here.

## References

- [Svelte packaging](https://svelte.dev/docs/kit/packaging)
- [Svelte diagnostics](https://github.com/sveltejs/language-tools/blob/master/packages/svelte-check/README.md)
- [Oxlint import restrictions](https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-restricted-imports)
- [Publint](https://publint.dev/docs/)
- [Dependabot configuration](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
