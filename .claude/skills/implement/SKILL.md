---
name: implement
description: Implement the work described by a ticket — from a pending spec change, the ticket description, or prior conversation — following the plan and test cases, and keeping specs in sync.
---

## Implement this

Implement the work described by the ticket. The starting point varies — work out which applies before writing code.

### What you're implementing

1. **Pending spec change on this branch?** Diff your branch against its base (usually `main`), scoped to `specs/`. If there are spec changes, that diff is the source of truth — the new/changed criteria describe the work.
2. **Otherwise, lead with the ticket description.** Read it carefully, and read the relevant existing specs in `specs/<area>/` for context. Where the description and the specs disagree, the description wins — implement to it, update the affected specs to match, and say which you changed and why.
3. **No spec at all?** Fall back to the ticket + conversation context; treat concrete decisions as the de-facto spec. If the behaviour is substantive and worth keeping, write it up as a spec change (see `.claude/skills/shared/spec-format.md`).

### The plan

The feature may have a plan (see `.claude/skills/shared/plan-format.md`).

- **Checklist exists** → work through it in order, ticking items (`- [ ]` → `- [x]`) as you complete them; expand a step into sub-items if it's larger than expected; note any drift from the plan.
- **Notes only** → use them as context and draft the checklist as you begin.
- **No plan, multi-stage work** → draft a plan before starting, then follow it.
- **Single focused change** → skip the plan, proceed.

### Implementation

- For UI work, follow `.claude/skills/shared/design-sourcing.md` — source the visual language, and **preserve unchanged aspects**.
- Make the code match the acceptance criteria — each criterion should be traceable to code.
- Follow the repo's conventions (`AGENTS.md` / `llm/project-rules/`).

### Test cases

The feature may have a test-cases doc (see `.claude/skills/shared/test-cases-format.md`). Read it alongside the specs; tick scenarios as your automated tests cover them; append new scenarios that implementation surfaces.

### Spec ambiguity

If a spec is unclear, contradictory, or missing something you need, don't guess — surface it and propose a spec edit first (prefer editing the existing spec). If there's no spec and the description/conversation is thin, ask rather than inventing behaviour.
