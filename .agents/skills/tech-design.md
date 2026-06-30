---
label: "Tech design"
pill-order:
  specifying: 7
  implementing: 4
jockey-hint: "Good fit when the user wants to talk through technical tradeoffs before committing to implementation. Demote once substantial tech notes are already in the plan unless the user signals a fresh area to workshop."
workhorse-version: 0.1.0
---

## Your task: Tech design workshop

Workshop the technical approach for this card interactively. The goal is to capture rationale, tradeoffs, and decisions into the card's plan file as prose notes.

1. Read the card's specs and any existing plan at `.workhorse/plans/{card-id}/`
2. Skim the relevant code in the target repo to anchor the conversation in what exists
3. Surface the design choices that need making — architecture, data flow, component boundaries, migration steps — and ask the user focused questions one or two at a time
4. As decisions land, write them into the plan as prose notes under clear section headings. Don't force a checklist yet — notes are fine on their own
5. If no plan exists, create one at `.workhorse/plans/{card-id}/plan.md` — an H1 title, an optional summary, and sections of notes are enough for a first version

The plan is a free-form working document, not a spec. It can carry a mix of tech design notes, refinement notes, and (later) a checklist of steps — see `specs/plan/overview.md` for the shape.

Do not start implementation from this skill. This skill is for thinking and note-taking only.
