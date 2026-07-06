---
name: plan-cards
description: "Workshop how to break this card into smaller spawned cards and capture entries in the card plan"
label: "Plan cards"
pill-order:
  not-started: 8
  specifying: 13
  implementing: 7
  reviewing: 7
surface: both
jockey-hint: "Always available but low-traffic — surface as an available pill, not a top suggestion. Most cards are implemented as one PR; only suggest prominently when the conversation has already revealed the card is too large to ship in one piece."
workhorse-version: 0.1.0
---

## Your task: Plan cards (project surface)

Workshop how to break this **project** into spawned cards and capture the breakdown in the project's card plan at `.workhorse/projects/{hash}-{slug}/card-plan.md`. The agent already knows the project's hash and slug from the workspace context.

The card plan has a strict shape:

- An H1 title and an optional intro paragraph
- A flat list of `## ` heading entries, one per spawned card
- Each entry's body is a short description paragraph (and optionally a `<!-- mockups: ... -->` comment) — no checklists, no sub-headings, no nested H3s, no build-step bullets

Once the user is ready, a bulk **Create cards** action turns each uncreated entry into a real card. Cards spawned from a **project** card plan inherit the **current project** and have **no parent dependency** — they are independent siblings under the project, not children of any card.

### How to run the workshop

1. Read the PRD at `.workhorse/projects/{hash}-{slug}/prd.md` and any existing card plan at `.workhorse/projects/{hash}-{slug}/card-plan.md`. If a PRD exists, ground every entry in something it actually covers
2. Skim the target repo where it helps you reason about boundaries between cards
3. Talk through how to slice the work — natural seams, dependency order, what each card should own. Ask focused questions one or two at a time
4. As entries become clear, write them into `card-plan.md` as `## ` headings with a short description paragraph beneath. Edit in place as the conversation refines them — adding, splitting, merging, reordering entries is normal
5. If `card-plan.md` does not yet exist, create it at the path above with an H1 title and the entries underneath. Do not create or edit any other file
6. **Suggest mockup carry-forward.** Each entry has an inline Mockups picker for choosing which of the project's mockups travel with the spawned card. As you write entries, populate the picker by inserting a structured comment line directly under the entry's `## ` heading: `<!-- mockups: slug-one, slug-two -->` (one comment per entry, comma-separated slugs from the project's `mockups/` directory). Pick only the mockups that fit each entry — the user can adjust later
7. Do not trigger bulk-create yourself. The user runs the **Create cards** action from the editor when they are ready

### What each entry should look like

- The `## ` heading is the spawned card's title — concise, action-oriented, no trailing punctuation, no code suffix (the editor stamps `· CODE` automatically once the card is created)
- The body beneath is the spawned card's description — a short paragraph (or two) covering scope and boundaries. Do not write a checklist, sub-headings, or implementation steps; that detail belongs in each card's own plan after it is created
- Spawned cards inherit the **current project** and have no parent dependency, so don't restate that

See `.workhorse/specs/project/card-plan.md` for the canonical shape.

### Restrictions on this surface

You are working on the **project surface**, not a card workspace. Edits in this conversation may only touch the project's artefacts, all on the project branch:

- `.workhorse/projects/{hash}-{slug}/prd.md`
- `.workhorse/projects/{hash}-{slug}/mockups/`
- `.workhorse/projects/{hash}-{slug}/card-plan.md`

Do **not** edit specs, per-card plans, test cases, card working docs, or any code. If the user asks for any of those, explain that the work belongs at card level — the user can either spawn a card via the card plan and continue there, or open an existing card and work on it.

You may **read** anything from the workspace's main branch for context.
