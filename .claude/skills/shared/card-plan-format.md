# Card-plan format (breaking work into smaller tickets)

A card plan slices a large ticket into smaller tickets — the parent stays as the umbrella, and the children carry the implementation work, each based on the parent.

## Location

`docs/specs/<area>/<feature>-card-plan.md` while workshopping it, or proposed directly for creation as Linear tickets once the breakdown is agreed.

## Shape

- An H1 title and an optional intro paragraph.
- A **flat list of `## ` headings**, one per proposed child ticket.
- Each entry's body is a **short description paragraph** covering scope and boundaries — **no checklists, no sub-headings, no nested H3s, no build-step bullets**. That detail belongs in each child's own plan after it's created.

## Each entry

- The `## ` heading is the child ticket's title — concise, action-oriented, no trailing punctuation.
- The body is the child's description — a short paragraph (or two) covering scope.
- Children inherit the parent's project and become "based on" the parent (via Linear relations); don't restate that.

## Creating the tickets

- **Don't create the tickets until the breakdown is agreed.** Then each entry becomes a child ticket based on the parent.
- Adding, splitting, merging, and reordering entries while workshopping is normal.

Written by **`/plan-cards`**.
