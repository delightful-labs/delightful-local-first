# Repository working agreements

- Follow the active feature in `.specify/feature.json` and its artifacts under `specs/`. Follow `.specify/memory/constitution.md` if one is adopted.
- This phase is specification-only. Do not implement the foundation, backend plugins, demonstration apps, or consumer migrations without a new instruction.
- Preserve the explicitly unanswered data abstraction and cross-app identity questions until the user resolves them.
- Treat every backend as an independently distributable plugin. Do not silently weaken app-required capabilities, permissions, or durability.
- Keep Finance and Clipper domain behavior outside the shared foundation. DUI owns generic presentation; this foundation owns identity/workspace compositions.
- Work on one task at a time and present it for review before beginning another. Change no more than one route or component per review cycle unless the user authorizes otherwise.
- Do not use `switch` statements or `case` clauses in new application code; prefer narrowing, lookup records, or clear conditionals. Bundled Spec Kit scripts are inherited tooling.
- Do not add or run implementation tests before the user reviews and approves the implementation they cover.
- Use the repository Prettier configuration and avoid unrelated formatting.
- When starting a development server, tell the user and provide its URL.
- Never commit or publish without explicit authorization.
