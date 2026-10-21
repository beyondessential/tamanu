# Move styled release notes out of the design library

## Why

**Before this card**, `.workhorse/design/designs/` held three published release-notes HTML
files. They are a customer-facing artefact, not a design. Their markdown twins already lived in
`docs/release-notes/`, so the pair belonged in one folder. (That folder now holds only a README;
every statement in this section describes the state the card started from.)

A note on the card's premise, **twice revised**. The card said `designs/` is defined nowhere in
the Workhorse docs. I first recorded that as out of date, on the basis that Workhorse defines the
folder at framework level as the home for a mockup worth keeping beyond one card. QA then
disproved that for *this repository*: `.agents/skills/mock-this-up/SKILL.md:27` routes a
persisting mockup to `components/` or `views/` and never mentions `designs/`, and nothing else
under `.agents/` defines it. So the card's original premise was closer to right than my
correction. Either way the move holds, for the simplest reason: published release notes are not a
mockup, whatever that folder is for.

## Decisions

- **Destination filename is `v2-64.html`**, not `v2-64-release-notes.html`. The stem matches the
  markdown twin exactly, so the pair sits adjacent in a listing. The `-release-notes` suffix is
  redundant inside a folder of that name.
- **Three files, not the two the card names.** `v2-66-release-notes.html` landed after the card
  was written (`9a8db4ba06`, card T9). Same artefact, same move.
- **`designs/` survives, carrying a README.** Without one the folder would vanish entirely, git not
  tracking empty directories. The README records only what is verifiable — that the release notes
  used to sit there and now live in `docs/release-notes/` — and defers to the Mock this up skill on
  where a persisting mockup belongs, rather than ruling on a convention this repository does not
  define. It said more than that at first; QA cut it back.
- **The skill edit is a surgical path swap.** Paths and the copy-from-newest glob only; the
  styled-version section keeps its existing structure and framing.
- **The guardrail bullet is rewritten, not dropped.** It should point away from both the design
  library and a card's mockups folder, so a future agent does not put the file back out of habit.
- **No spec change.** `specs/` covers Tamanu product behaviour by area. A repo file-layout and
  skill convention is not product behaviour.
- **v2-61, v2-62 and v2-63 are backfilled on this card**, so every version in the folder is a
  complete markdown-and-HTML pair rather than leaving a visible gap at the top of the listing.

## What the reconnaissance found

- All three HTML files are self-contained: inline CSS, and the only external references are Google
  Fonts CDN links. Nothing points into `.workhorse/design/assets/`, so the move breaks no addresses.
- The skill was the only thing in the repo referencing `designs/` — seven hits, all in
  `.agents/skills/draft-release-notes/SKILL.md`, as at drafting. All seven are now gone; the file
  has none. (Line numbers originally recorded here have been dropped: they rotted as soon as the
  file was edited.) The `release-notes-images` job in `.github/workflows/cd.yml` turned out to be
  unrelated: it appends container image tables to the GitHub release body.
- `docs/README.md` indexes only the support pack. `release-notes/` already sits there unindexed
  alongside `api/`, `provisioning/` and `requests/`, so the HTML joins an established neighbour
  rather than intruding on the support pack's structure.
- **Corrected after QA.** The plan previously said the styled notes stop being browsable in the
  design surface once they leave `.workhorse/design/`. That is not true on merge alone. The design
  surface renders the `workhorse/design` branch, which is currently 3 commits behind `main` and
  still carries `v2-64-release-notes.html` and `v2-65-release-notes.html` in `designs/`. Until
  someone merges `main` forward, the old files remain visible there, the new README never appears,
  and nothing is removed from where people actually browse. The intent stands; the timing was
  wrong.

### What the backfill involves

- **The styling lineage is stable.** The CSS block in all three existing styled files is
  byte-identical, so "copy the most recent" has not caused drift. The backfill inherits that same
  CSS unchanged, and all six files end up matching.
- **All three carry real release dates** — 10-08-2026, 17-08-2026 and 03-09-2026 — so none needs a
  date placeholder. (v2-65 and v2-66 do carry one in both formats; that is pre-existing and not
  this card's to fix.)
- **Unfilled Slab placeholders render literally**, following the precedent the existing styled
  files set: `<span class="placeholder">[SLAB_LINK_PLACEHOLDER]</span>`, with the footer line
  explaining that the links await real URLs. v2-61 has 13 of them and v2-62 has 4.
- **v2-63 has none**, so it should omit that footer line rather than carry a sentence that is false
  for it.
- **v2-63 also has no Major Features section** — its markdown opens at System Enhancements. The
  rendering omits the section rather than emitting an empty one.
- Sizes are uneven: v2-61 is the big one at 20 headings, v2-62 has 17, v2-63 only 9.

## Steps

- [x] `git mv` the three files into `docs/release-notes/`, dropping the `-release-notes` suffix, so
      rename detection records a move rather than a delete plus an add
- [x] Add `.workhorse/design/designs/README.md` recording that the release notes moved out, and
      deferring to the Mock this up skill on what else belongs there. It deliberately does not say
      what the folder is for: this repository does not define `designs/`, and claiming otherwise is
      what QA struck out of the first version
- [x] Update the skill's frontmatter description
- [x] Update the opening "two files kept in step" sentence
- [x] Update the output-files line
- [x] Update the styled-version section's opening sentence
- [x] Update the copy-from-newest instruction to glob the new location
- [x] Rewrite the guardrail bullet to point away from the design library and card mockups
- [x] Update numbered step 8
- [x] Grep the repo for surviving `designs/` and `-release-notes.html` references
- [x] Open a moved file in a browser to confirm it still renders

### Backfill

- [x] Render `docs/release-notes/v2-63.html` from its markdown — smallest, and the one that
      exercises both a missing Major Features section and the no-placeholder footer case
- [x] Render `docs/release-notes/v2-62.html`
- [x] Render `docs/release-notes/v2-61.html` — the largest of the three
- [x] Proofread each against its markdown twin: every heading present, in order, with no wording
      introduced that the markdown does not carry
- [x] Open all three in a browser alongside v2-66 to confirm they are visually consistent

## Open

- Nothing blocking. The Slab links left as placeholders in v2-61, v2-62, v2-64 and v2-66 are a
  pre-existing human task, not this card's work — the backfilled HTML carries them through exactly
  as its markdown does.
