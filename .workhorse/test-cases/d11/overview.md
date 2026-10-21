# Move styled release notes out of the design library

Verification for a file move and a skill edit. No product behaviour changes, so these are
structural and documentary checks rather than clinical scenarios.

## The move

- [x] `docs/release-notes/` holds `v2-64.html`, `v2-65.html` and `v2-66.html`
- [x] `.workhorse/design/designs/` holds no release-notes HTML
- [x] Each moved file's content is byte-identical to what it held in `designs/` — this move
      renames, it does not edit. Confirmed by `git diff --cached -M --name-status` scoring all
      three `R100`, with zero lines added or deleted
- [x] `git log --follow` on a moved file reaches its original commit. Each of the three traces
      back through the rename to the commit that first created it (`b9bd0fb78f`, `c4c4d7bd58`,
      `9a8db4ba06`)
- [x] The six markdown files in `docs/release-notes/` are untouched by both the move and the
      backfill
- [x] `v2-66.html` opened in a browser renders as it did from the design library: Inter loads from
      the CDN, layout and colours unchanged

## The backfilled versions

- [x] `docs/release-notes/` holds `v2-61.html`, `v2-62.html` and `v2-63.html`, so every **version**
      markdown file in the folder has an HTML twin. The folder's `README.md` is not a version file
      and deliberately has no twin
- [x] Each backfilled file's CSS block is byte-identical to `v2-66.html`'s, so all six match
- [x] Each carries its real release date above the title — 10-08-2026, 17-08-2026 and 03-09-2026
      respectively — and no date placeholder
- [x] Every heading in each markdown twin appears in its HTML, in the same order
- [x] No backfilled file adds or drops any *content* against its markdown twin: every heading,
      bullet and paragraph matches in order (verified by word-level sequence diff). The documents
      do carry three pieces of synthesised boilerplate with no markdown source — the `<title>`, the
      masthead `<h1>`, and the footer line about outstanding placeholders — exactly as the three
      pre-existing files do. Those are the only additions, and they are deliberate
- [x] `v2-61.html` carries 13 Slab placeholders and `v2-62.html` carries 4, each rendered in the
      placeholder style the existing files use
- [x] `v2-63.html` carries no Slab placeholders, and omits the footer line about links awaiting
      real URLs rather than carrying a sentence that is false for it
- [x] `v2-63.html` has no Major Features section, matching its markdown, and shows no empty
      section heading in its place
- [x] The three open in a browser looking consistent with `v2-66.html`

## The folder left behind

- [x] `.workhorse/design/designs/README.md` exists and records that the styled release notes used
      to sit there and now live in `docs/release-notes/`. It deliberately makes no ruling on where
      a persisting mockup belongs, deferring to the Mock this up skill, because this repository
      does not define `designs/` and `mock-this-up` routes such mockups to `components/` or
      `views/`
- [x] The README does not describe release notes as belonging there

## The skill

- [x] `.agents/skills/draft-release-notes/SKILL.md` contains no reference to
      `.workhorse/design/designs/`
- [x] The frontmatter description names the new HTML path
- [x] The output-files line names `docs/release-notes/v2-45.html` alongside its markdown twin
- [x] The copy-from-newest instruction globs the new location
- [x] The guardrail bullet points away from both the design library and a card's mockups folder
- [x] Numbered step 8 names the new path
- [x] Reading the skill end to end for a hypothetical v2.67 would put both output files in
      `docs/release-notes/`, with no step sending either into the design library

## Repo-wide

- [x] No file outside `docs/release-notes/` references a `*-release-notes.html` path
- [x] The `release-notes-images` job in `.github/workflows/cd.yml` is unchanged — it was never
      related to these files

## QA loop regressions

- [x] The "Start from the highest-version existing styled file" bullet in
      `.agents/skills/draft-release-notes/SKILL.md` states explicitly that "newest" means the
      highest version number, and that neither modification time nor plain filename order picks
      the file. `ls -lt docs/release-notes/*.html` puts the three backfilled files (the oldest
      versions) above v2-66, so an agent reading the bare word "newest" as modification time copies
      one of the oldest. Which of the three lands first is not stable, since any later edit reorders
      them — re-run the command rather than trusting a transcript of it
- [x] `.workhorse/design/designs/README.md` makes no claim about where a mockup meant to persist
      belongs, and asserts only what the repo verifiably does — that the styled release notes used
      to live here and now live in `docs/release-notes/` — pointing to the Mock this up skill for
      where a lasting mockup goes instead
- [x] None of `docs/release-notes/v2-61.html`, `v2-62.html`, `v2-63.html` contain an HTML comment
      naming a card, ticket, branch or commit (`grep -i "card d11" docs/release-notes/v2-6{1,2,3}.html`
      returns nothing), and no other byte of those three files changed

## QA loop round 2 (cold)

- [x] `docs/release-notes/README.md` exists and states that the markdown and HTML pair is
      deliberate, so that anyone opening the folder can see why each version appears twice and that
      the two must be changed together. The invariant was previously stated only in the Draft
      release notes skill, which a reader browsing `docs/` would not think to open.
      (An earlier version of this case justified the file by claiming `curate-support-docs` might
      reconcile the pairs away. That was wrong and is not the reason: a re-check established that
      skill tends `docs/runbooks/`, the ruled-out list, deployment context and sibling procedure
      notes, which release notes are not.)
- [x] No test case in this file contradicts another. Specifically, the two cases describing
      `.workhorse/design/designs/README.md` agree with each other and with the artefact
- [x] `.workhorse/plans/d11/plan.md` distinguishes the state the card started from (its "Why" and
      "What the reconnaissance found" sections, written about the before-state) from the state now,
      so no sentence reads as a false present-tense claim. Its design-surface claim and
      `designs/`-is-defined rationale were corrected after QA disproved them, and a later claim
      audit removed stale line numbers and reworded two before-state assertions.
      Note this case cannot be fully mechanised: it was checked by an adversarial claim audit that
      ran down roughly 55 assertions individually, not by a command

## QA loop round 6 regressions

- [x] **Every** place the skill refers to which styled file to copy says the highest version number,
      not the most recent: the bullet's bold lead-in, the bullet's body, and numbered step 8.
      `grep -n "most recent" .agents/skills/draft-release-notes/SKILL.md` returns only the explicit
      negation "(not the most recently modified)". The first fix patched the bullet body alone, so
      an agent skimming bold lead-ins or working down the numbered workflow still read "most
      recent" and would have gone to modification time
- [x] The skill's YAML frontmatter still parses after the edits, carrying `name`, `description` and
      `label`
- [x] The plan's step for `.workhorse/design/designs/README.md` describes what that README actually
      does (records the move, defers to the Mock this up skill) rather than claiming it describes
      what the folder is for, which it deliberately does not
