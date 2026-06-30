---
label: "Plan cards"
pill-order:
  not-started: 8
  specifying: 13
  implementing: 7
  reviewing: 7
jockey-hint: "Always available but low-traffic — surface as an available pill, not a top suggestion. Most cards are implemented as one PR; only suggest prominently when the conversation has already revealed the card is too large to ship in one piece."
workhorse-version: 0.1.0
---

## Your task: Plan cards

Workshop how to slice this card into smaller spawned cards and capture the breakdown in the card plan at `.workhorse/plans/{card-id}/card-plan.md`.

**The card plan is not the implementation plan.** Do not edit `.workhorse/plans/{card-id}/plan.md` — that is a separate, free-form working document for tech-design notes and build steps. The card plan has a strict shape:

- An H1 title and an optional intro paragraph
- A flat list of `## ` heading entries, one per spawned card
- Each entry's body is a short description paragraph (and optionally a `<!-- mockups: ... -->` comment) — no checklists, no sub-headings, no nested H3s, no build-step bullets

Once the user is ready, a bulk Create cards action turns each uncreated entry into a real spawned card based on this one. The parent stays as the umbrella while the children carry the implementation work.

### How to run the workshop

1. Read the card's specs in `specs/`, the card description, and any existing **card-plan** file at `.workhorse/plans/{card-id}/card-plan.md`. Ignore `plan.md` in the same folder — it is a different artifact and not what you are editing here
2. Skim the target repo where it helps you reason about boundaries between the children
3. Talk through how to slice the work — natural seams, dependency order, what each child should own. Ask focused questions one or two at a time
4. As entries become clear, write them into `card-plan.md` as `## ` headings with a short description paragraph beneath. Edit in place as the conversation refines them — adding, splitting, merging, reordering entries is normal
5. If `card-plan.md` does not yet exist, create it at the path above with an H1 title and the entries underneath. Do not create or edit any other file
6. **Suggest mockup carry-forward.** Each entry has an inline Mockups picker for choosing which of the parent's mockups travel with the spawned card. As you write entries, populate the picker by inserting a structured comment line directly under the entry's `## ` heading: `<!-- mockups: slug-one, slug-two -->` (one comment per entry, comma-separated slugs from `.workhorse/design/mockups/{card-id}/`). Pick only the mockups that fit each entry — the user can adjust later
7. Do not trigger bulk-create yourself. The user runs the Create cards action from the editor when they are ready

### What each entry should look like

- The `## ` heading is the spawned card's title — concise, action-oriented, no trailing punctuation, no code suffix (the editor stamps `· CODE` automatically once the card is created)
- The body beneath is the spawned card's description — a short paragraph (or two) covering scope and boundaries. Do not write a checklist, sub-headings, or implementation steps; that detail belongs in each child card's own plan after it is created
- Spawned cards inherit the parent's project and become "based on" the parent via dependencies, so don't restate that

See `specs/card/card-plan.md` for the canonical shape.
