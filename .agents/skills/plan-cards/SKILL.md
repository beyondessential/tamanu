---
name: plan-cards
description: Workshop how to break a large feature or ticket into smaller tickets, capturing the breakdown as a flat list of proposed tickets with short descriptions.
---

## Plan cards

Workshop how to slice a large feature/ticket into smaller tickets and capture the breakdown (e.g. in `specs/<area>/<feature>-card-plan.md`, or directly as tickets once agreed).

1. Read the feature's specs, the ticket description, and any existing breakdown.
2. Skim the repo where it helps you reason about boundaries between the pieces.
3. Talk through how to slice the work — natural seams, dependency order, what each piece should own. Ask focused questions one or two at a time.
4. As entries become clear, write them as a flat list: one `## ` heading per proposed ticket (concise, action-oriented title) with a short description paragraph beneath covering scope and boundaries. Adding, splitting, merging, reordering entries is normal.
5. Keep each entry to a title + short description — no checklists or implementation steps; that detail belongs in each child ticket's own plan once it exists.

Don't create the tickets yourself unless asked — agree the breakdown with the user first.

See `.agents/skills/shared/card-plan-format.md` for the breakdown's shape.
