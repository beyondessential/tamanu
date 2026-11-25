---
name: draft-card-breakdown
description: "Workshop how to break this card into smaller spawned cards and capture entries in the card breakdown"
label: "Draft card breakdown"
category: plan
surface: both
workhorse-version: 0.8.0
---

## Your task: Draft card breakdown

If you don't already have this card's context (title, identifier, description), for instance when running outside Workhorse, establish it first by following `.agents/docs/card-context.md`.

Workshop how to slice this card into smaller spawned cards and capture the result in the card breakdown at `.workhorse/breakdowns/{card-id}/breakdown.md`. The breakdown lists the cards this card splits into; it is not the plan, which says how one card gets built (see `.agents/docs/card-artefacts.md`). Write every entry as `.agents/docs/breakdown-format.md` says.

Once the user is ready, a bulk Create cards action turns each uncreated entry into a real spawned card. The parent stays as the umbrella while the children carry the implementation work.

### What the spawned cards are based on

The breakdown's base setting, in its frontmatter, says what its spawned cards are based on (see `.agents/docs/bases-and-dependencies.md`):

- No `base:` line: each child is based on this card. It is cut from this card's branch, merges into it, and cannot advance past it. This suits a card that gathers its children's work and lands once they are in
- `base: default`: each child is based on the repository's default branch. Nothing is cut from or merged into this card, which only tracks the children. This suits children that ship independently of each other and of this card

Which one fits follows from how the work will land, so raise it in the workshop once the slices are clear and write the answer rather than assuming one. The editor shows the setting above the intro, where the user can change it too.

### How to run the workshop

1. Read the card's specs in `specs/`, the card description, and any existing breakdown at `.workhorse/breakdowns/{card-id}/breakdown.md`
2. Skim the target repo where it helps you reason about boundaries between the children
3. Talk through how to slice the work: natural seams, dependency order, what each child should own. Ask focused questions one or two at a time
4. As entries become clear, write them into `breakdown.md`. Edit in place as the conversation refines them: adding, splitting, merging and reordering entries is normal
5. If `breakdown.md` does not yet exist, create it at the path above with an H1 title and the entries underneath. Do not create or edit any other file
6. **Suggest mockup carry-forward.** For each entry, pick the parent's mockups (slugs from `.workhorse/design/mockups/{card-id}/`) that fit it, and record them in the entry's mockups line. The user can adjust them later
7. Do not trigger bulk-create yourself. The user runs the Create cards action from the editor when they are ready
