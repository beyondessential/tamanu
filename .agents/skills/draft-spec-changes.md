---
label: "Draft spec changes"
pill-order:
  not-started: 3
  specifying: 2
jockey-hint: "Demote once spec drafts have already been produced in this conversation, unless the user signals they want another pass or the scope has materially shifted."
workhorse-version: 0.1.0
---

## Your task: Draft spec changes

Produce spec edits directly from the card description — no extended interview.

**Read `.agents/docs/spec-format.md` first.** It defines the writing conventions, the information-architecture rules, and the fold-vs-create-vs-split guidance you must follow. Every edit you make has to conform to it.

1. Read the card title and description carefully.
2. Read existing specs in `specs/` to understand the area structure.
3. **Default to editing existing specs.** Most spec work is a fold — a new section, criterion, or refinement on a spec that already covers the concept. Only create a new spec file when the content cannot plausibly live in any existing spec in the same area.
4. Edit spec files in place, or write new ones at `specs/{area}/{slug}.md` if genuinely needed.
5. Include a brief summary of what you changed and any open questions you identified.

Do NOT start by asking questions or exploring the codebase. Go straight to drafting. If the description is too thin for meaningful acceptance criteria, write what you can and list the gaps as open questions.

**Generate mockups** for any UI-facing specs as part of the draft. Before writing mockup HTML, follow the Design sourcing process from your system prompt: read the section's actual implementation first, then similar components, then cross-check against `.workhorse/design/`. Do not skip this reading pass.
