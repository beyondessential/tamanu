---
workhorse-version: 0.8.0
---

# Card artefacts

Specs are the product's lasting record and land with the card's work. Alongside them a card keeps working files of its own, each in a folder named for the card. `{card-id}` in the paths below is that folder name: a Workhorse turn names it, and outside one it is the card's identifier (see `.agents/docs/card-context.md`).

| Artefact | Where it lives | What it is for |
|---|---|---|
| Plan | `.workhorse/plans/{card-id}/plan.md` | How this card gets built: design notes and a checklist of steps. |
| Test cases | `.workhorse/test-cases/{card-id}/overview.md` | The scenarios that show the card is done, for a tester and for automated tests. |
| Breakdown | `.workhorse/breakdowns/{card-id}/breakdown.md` | The smaller cards this card splits into. |
| Working doc | `.workhorse/working-docs/{card-id}/working-doc.md` | A drafting space for a large card, split later into specs, plan and test cases. |
| Mockups | `.workhorse/design/mockups/{card-id}/` | Standalone HTML illustrating the card's UI. |
| Handoff | `.workhorse/handoffs/{card-id}/handoff.md` | A briefing for an agent outside Workhorse, too long to paste. |

Create a file when the work needs it and it does not exist yet; no one skill owns creating any of them.

## Card scratch

Every artefact in that table is card scratch: it serves the card while it is worked and does not stay in the repository.

- When a card merges into a branch of the repository, Workhorse empties the plans, test-cases, breakdowns, working-docs and mockups trees on the card's branch first, unless the merge's Remove artifacts setting is off. It empties the whole of each tree, whichever card a file belongs to, so nothing that should outlive a card is ever filed in them.
- A card merging into a parent card's branch carries its scratch up to the parent by default, and it is stripped when the parent merges.
- The merge does not sweep handoffs. The agent that reads a handoff deletes it and commits the deletion once it has read it.
- Merging by hand outside Workhorse, empty the same five trees yourself first, commit and push. Leave handoffs, as the merge does.
- A mockup that someone outside the card will need, because someone else implements it, it covers several cards' work, or it is handed on, goes in `.workhorse/design/designs/` instead, where it persists.

## The plan

- The plan says how this card gets built. Splitting the card into smaller cards is the breakdown's, never the plan's.
- It is free-form markdown: an H1 title, an optional summary, then prose sections and `- [ ]` checklist sections, with headings that suit the card. It is a working document, not a spec, and its checkboxes are build steps, not product behaviour.
- When a conversation settles a technical decision, a trade-off or a sequencing note worth keeping, add it to the plan as a prose note, and say in a line that you did.
- When implementing, treat the checklist as your record: tick items as they complete, expand a step into sub-items when it turns out larger than planned, and note where the work has drifted from it.

## The test cases

- Each item is one concrete scenario in operational voice: a thing to do and what to observe. Prose notes around the checklist are fine.
- Every case is coverage the card owes, ticked or not. An unticked box is a scenario not yet covered and still owed, not an optional extra or a decision to skip.
- Tick a case when it is covered, by an automated test that exercises it or by a tester who has run it.
- Never delete a case to account for coverage you did not complete. Leave it unticked. Remove a case only when the behaviour it verifies has gone, usually because a spec changed.
- Cite the spec id where a case directly verifies an acceptance criterion ("verifies spec: ALG"). Cases with no citation are fine for operational concerns such as smoke checks, cross-browser runs or feel.
- Add cases as implementation surfaces scenarios worth verifying.

## The breakdown

- A request to add, remove, split or reword a draft card is about the breakdown, not the plan. Most cards have no breakdown.
- Entries are written as `.agents/docs/breakdown-format.md` says. An entry whose heading ends in ` · CODE` is tracked by that card already. Stamp an entry yourself only to track a card that exists, as that doc says, and leave the base setting in the frontmatter as it is unless the user asks to change it.

## The working doc

- While a card's working doc is in `draft`, it is where the card's findings and notes are written, in working voice, instead of the specs and plan. Its shape is in `.agents/docs/working-doc-format.md`.

## Mockups

- A mockup is a standalone HTML file with inline CSS and an HTML comment header naming the spec it illustrates, such as `<!-- spec: patient/allergies.md -->`.
- Its visual language comes from the sources in `.agents/docs/design-sourcing.md`, in that order.
