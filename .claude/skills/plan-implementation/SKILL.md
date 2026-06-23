---
name: plan-implementation
description: Draft or refine a sequenced implementation checklist for a feature, from its specs and the current code.
---

## Plan implementation

Draft or refine the implementation checklist in the feature's plan doc — turning the specs and any tech-design notes into a sequenced checklist of build steps.

1. Read the feature's specs in `docs/specs/<area>/` and any existing plan doc.
2. Skim the repo to ground the steps in the existing code.
3. If a plan already exists, edit it in place — add, refine, or reorder checklist sections around the existing prose notes. Don't replace notes.
4. If none exists, create one (e.g. `docs/specs/<area>/<feature>-plan.md`) with an H1 title, a short summary, and one or more checklist sections.
5. Each checklist item is a concrete step — a file to change, a feature to wire up, a migration to author. Avoid vague items like "add tests".
6. Ask only the clarifying questions you genuinely need — one or two turns, not an extended interview.

The plan is a free-form working document, not a spec — checkboxes describe build steps, not product behaviour. See `.claude/skills/shared/plan-format.md` for its shape.
