---
name: draft-spec-changes
description: Draft edits to existing specs (or a new spec if none fits) directly from a feature or ticket description, without an extended interview.
---

## Draft spec changes

Produce spec edits directly from the ticket/feature description — no extended interview.

Read `.claude/skills/shared/spec-format.md` first; every edit must conform to it (writing conventions, fold-vs-create-vs-split).

1. Read the ticket title and description carefully.
2. Read existing specs in `docs/specs/<area>/` to understand the area structure.
3. **Default to editing existing specs** — most work is a fold. Only create a new spec file when the content can't live in any existing spec in the area.
4. Edit spec files in place, or write a new one at `docs/specs/<area>/<slug>.md` if genuinely needed.
5. Summarise what you changed and list any open questions you identified.

Do not start by asking questions or exploring the codebase — go straight to drafting. If the description is too thin for meaningful criteria, write what you can and list the gaps as open questions.
