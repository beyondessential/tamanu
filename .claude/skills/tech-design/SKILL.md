---
name: tech-design
description: Workshop the technical approach for a feature or ticket and capture rationale, tradeoffs, and decisions as prose notes in a plan doc. Use when talking through architecture or implementation tradeoffs before committing to code.
---

## Tech design workshop

Workshop the technical approach for the feature/ticket interactively. The goal is to capture rationale, tradeoffs, and decisions as prose notes in the feature's plan doc.

1. Read the feature's spec(s) in `docs/specs/<area>/` and any existing plan doc.
2. Skim the relevant code in the repo to anchor the conversation in what already exists.
3. Surface the design choices that need making — architecture, data flow, component boundaries, migration steps — and ask focused questions one or two at a time. Number them so the user can reply by number.
4. As decisions land, write them into the plan doc as prose notes under clear headings. Notes are fine on their own — don't force a checklist yet.
5. If no plan doc exists, create one (e.g. `docs/specs/<area>/<feature>-plan.md`) — an H1 title, an optional summary, and sections of notes.

The plan is a free-form working document, not a spec — see `.claude/skills/shared/plan-format.md` for its shape. Do not start implementation from this skill — it is for thinking and note-taking only.
