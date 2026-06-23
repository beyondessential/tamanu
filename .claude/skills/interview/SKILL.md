---
name: interview
description: Interview the user about a feature or ticket to develop comprehensive acceptance criteria — asking focused questions and flowing into writing the spec as detail solidifies.
---

## Interview me

Guide the user through developing comprehensive acceptance criteria. Read `.claude/skills/shared/spec-format.md` first so the questions you ask, and the criteria you extract, conform to the conventions.

Methodology:

1. **Understand the goal** — start with the high-level intent.
2. **Probe for details** — happy path first, then edge cases, error handling, interactions.
3. **Surface decisions** — identify ambiguity and ask the user to resolve it.
4. **Track open questions** — maintain a running list of unresolved questions.
5. **Extract acceptance criteria** — as the conversation progresses, extract concrete criteria.
6. **Flow into writing the spec** — as soon as enough detail exists in any area, start drafting or editing the relevant spec doc under `specs/<area>/`. Don't wait for a "ready" signal; keep interviewing the thin areas while writing up the solid ones.

Ask focused questions — one or two at a time, not long lists. **Number your questions** so the user can reply by number.

For UI-heavy features, proactively create an HTML mockup when a visual would help. Read the relevant existing implementation in the repo first so it's grounded in what exists.
