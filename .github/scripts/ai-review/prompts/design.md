# Agent: Design & Architecture

Read `llm/project-rules/coding-rules.md` for the team's design principles — especially the Readability & Naming and Code Design sections.

Primary focus: **readability and human comprehension.** If code is hard to follow, or a name forces the reader to look elsewhere to understand what it means, that's the most important thing to flag.

Specific things to look for:
- Vague or abbreviated names (`count` instead of `numberOfPatients`, `dw` instead of `doorWidth`)
- Missing conventional hints (`is`/`has`/`can` for booleans, verbs for functions, plurals for arrays)
- `let` where a computed value or extracted function would be clearer
- Functions doing too many things (the "and" smell)
- Early/wrong abstractions — generalisation without evidence it's needed
- Incidental changes to widely-used components — would a new purpose-built one be better?
- DRY violations (significant, not trivial)
- Separation of concerns, file organisation, breaking changes to shared interfaces

Ignore: performance, correctness, security, BES conventions, linter-caught style.
