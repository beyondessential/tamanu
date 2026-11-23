---
name: implement-this
description: "Implement this card, or carry on from the changes just discussed"
label: "Implement"
category: build
workhorse-version: 0.8.0
---

## Your task: Implement

If you don't already have this card's context (title, identifier, description) — for instance when running outside Workhorse — establish it first by following `.agents/docs/card-context.md`.

Implement the work described by this card. The starting point varies — figure out which one applies before writing code.

**When code changes already exist on the branch, this is usually a continuation rather than a fresh start.** Read the recent conversation first: if the user has just discussed a change, a fix, or a next step, that discussion is what to implement. Pick up from where the branch and the conversation leave off rather than re-reading the whole card and starting again.

### Work out what you're implementing

1. **Is there a pending spec change on this branch?** Diff this card's branch against its base (see `.agents/docs/bases-and-dependencies.md`), scoped to `specs/` and `.workhorse/design/mockups/`. If there are spec or mockup changes, that diff is the source of truth for what you're building: new and changed criteria describe the work
2. **Otherwise, lead with the card description.** Read the title and description carefully — that's what the user wants. Read relevant existing specs in `specs/` for context: how the surrounding behaviour is supposed to work, what conventions and edge cases already exist. Where the description and the existing specs disagree, the description wins — implement to the description, update the affected specs to match, and mention in chat which specs you updated and why
3. **No spec at all?** Fall back to the card title, description, and any conversation context (e.g. a prior workshop or ASCII design chat). Treat concrete decisions from the conversation as the de facto spec and proceed. If the resulting behaviour is substantive and worth keeping in the knowledge base, write it up as a spec change as part of this work — same fold-vs-create rules apply (see `.agents/docs/spec-format.md`)

### The plan

This card may have a plan at `.workhorse/plans/{card-id}/plan.md`. Its rules, including ticking the checklist as you go, are in `.agents/docs/card-artefacts.md`.

- **If a plan with a checklist exists**, work through it in order
- **If a plan exists but has notes only**, use the notes as context and draft the checklist yourself as you begin
- **If no plan exists and the work looks multi-stage**, draft one before starting code work, then follow it
- **If the work is a single focused change**, skip the plan and proceed directly

### Implementation

- For any UI work, follow `.workhorse/design/design-system.md`, source the visual language and preserve unchanged aspects of the screen as `.agents/docs/design-sourcing.md` says
- Make the code match the acceptance criteria: each criterion should be traceable to code
- Commit as `.agents/docs/checkout.md` says. The card's pull request is opened by Workhorse, never by you (see `.agents/docs/pull-requests.md`)

### Test cases

The card may have test cases at `.workhorse/test-cases/{card-id}/`: the scenarios that verify the card is done, and a running record of what is covered. Read them alongside the specs, tick each scenario as an automated test you write covers it, and add scenarios as implementation surfaces them. If none exist and the card has behaviour worth verifying, create `.workhorse/test-cases/{card-id}/overview.md`. The rules, including leaving an uncovered case unticked rather than deleting it, are in `.agents/docs/card-artefacts.md`.

### Spec ambiguity

If while implementing you find the spec is unclear, contradictory, or missing something you need, don't guess. Surface it in chat and propose a spec edit before continuing. Prefer editing the existing spec over creating a new one (see `.agents/docs/spec-format.md`).

If there's no spec and the description/conversation is thin, say so and ask rather than inventing behaviour.

### Last step: the progress summary

When this stage's work is done, bring the card's progress summary up to date as `.agents/docs/progress-summary.md` says.
