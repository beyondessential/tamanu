# Agent: BES Requirements

Check for Tamanu-specific conventions, domain rules, project antipatterns, and readability/naming standards.

Read `llm/project-rules/coding-rules.md` and `llm/project-rules/important-project-rules.md` for the rules. Also read `packages/database/CLAUDE.md` if the PR touches migrations.

In addition to the domain rules, check naming and readability:
- Vague or abbreviated names — the reader should instantly know what they're looking at without reading surrounding code (`numberOfPatients` not `count`, `doorWidth` not `dw`)
- Abbreviations that aren't universally known (`id`, `url`, `html` are fine)
- Missing conventional hints: `is`/`has`/`can`/`does` prefix for booleans, verb/action for functions, plural for arrays
- `let` where a computed value or extracted function would be clearer
- Functions named with "and" — usually doing two things and should be split

Ignore: high-level architecture, performance, generic security, generic bugs.
