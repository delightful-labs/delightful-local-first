# Delightful Local First

Shared local-first app foundation with independently maintained backend plugins, informed by Delightful Finance and Delightful Clipper.

This repository currently contains a draft specification only. No library, adapters, demonstration app, or tests have been implemented.

- [Foundation specification](specs/001-local-first-foundation/spec.md)
- [Specification quality checklist](specs/001-local-first-foundation/checklists/requirements.md)

The next step is to clarify the shared data boundary and cross-app identity. Jazz and a second qualified backend will validate the eventual plugin contract; DXOS is the first candidate, not a selected dependency.

## Spec Kit

The repository is bootstrapped from the existing local Spec Kit 1.1.3 scaffold because the `specify` CLI is not installed. Templates, shell scripts, workflows, and Codex skills are included. No extension hooks are installed. `.specify/feature.json` identifies the active feature independently of the Git branch.

No project constitution has been adopted. `.specify/memory/` is reserved for it; the constitution template is available for a future explicit governance decision. Finance's constitution and domain artifacts have not been copied.

Use the local `speckit-clarify` skill to refine the draft, then establish project governance and create a technical plan when the requirements are ready. Backend qualification and DUI gap recommendations are future feature work, not results of this bootstrap.
