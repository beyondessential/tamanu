---
name: draft-release-notes
description: >-
  Draft public Tamanu release notes for a given version. Use when the user wants release notes for a
  Tamanu release (e.g. "draft release notes for v2.45"). Pulls work from the specs and code that landed
  in that version's release/X.Y branch, plus the matching issues in the trackers (Linear's Tamanu team
  and Workhorse's Tamanu workspace), reconciles them, and writes docs/release-notes/vX-YY.md in the
  canonical v2.44 format for project managers and system administrators. Not for developer changelogs
  or QA test scoping (use scope-tamanu-release-tests for the latter).
label: "Draft release notes"
---

# Draft release notes

Produce **public release notes** for one Tamanu version and write them to `docs/release-notes/vX-YY.md`.

The audience is **project managers and system administrators**, not developers. They read these notes to understand what new capabilities their teams gain, what workflows change, what configuration is required, and what to prepare and test before upgrading. Write to that audience throughout: user-facing capabilities and benefits, not implementation detail.

The canonical format is the published **v2.44** notes, kept alongside this skill at `example-v2-44.md`. Read it first — it is the reference for section order, headings, emoji markers, voice, and how much detail each section carries.

If `docs/release-notes/vX-YY.md` already exists, that version has been written up — deliver the existing notes rather than redrafting them, unless the user asks for a rewrite.

## Input

The user specifies the **version** (e.g. `v2.45`, or `2.45`). Normalise it to:

- **Release branch** `release/2.45`
- **Output file** `docs/release-notes/v2-45.md` — the filename hyphenates the version, so the only dot in it is the extension's
- **Linear version label** — the label for that version (often `v2.45.0`); confirm the exact label against the Tamanu team's labels rather than assuming. Version labels also drift, so ground the notes in what code shipped rather than assuming Linear is correct.

Ask for the **release date** if the user hasn't given it. Format it `DD-MM-YYYY` in the header. If it's genuinely not known yet, leave `Released [RELEASE_DATE_PLACEHOLDER]`.

## Sourcing: two places to look

Work included in a version comes from **both** of these. The repo is the primary source for what shipped and how it behaves; the trackers supply the human framing. Gather from each, then reconcile.

Cards live in **both** trackers — Linear for older work, Workhorse for recent cycles — so check both. A single version often draws on each.

### 1. Issue trackers (Linear — the Tamanu team, and Workhorse — the Tamanu workspace)

**In Linear**, pull issues on the **Tamanu** team labelled with the version (e.g. `v2.45.0`). Filter issues directly by the label string; the label-search tool is unreliable for version labels, so read the labels on a returned issue to confirm the exact spelling rather than trusting a label lookup. Filtering to the Tamanu team already excludes DataTrak, Tupaia, and other non-Tamanu product work — they live on separate teams.

**In Workhorse**, cards carry no version label, so version membership comes from the release branch instead: collect the card codes from the branch's commit history (commit subjects carry them, e.g. `feat(web): F3: …`) and read each card. Listing cards in a shipped status — Merged to Main, Release: Regression Ready, Complete: Docs Required, Complete — gives a second list to cross-check that against, catching anything whose commits you missed.

Then, in **either** tracker:

- **Only include work that landed.** A version label or a spec branch records intent to ship, not the outcome. Drop anything cancelled, still in progress, or bumped to a later release, and confirm against the branch. Never describe work that didn't ship.
- **Exclude internal / non-user-facing work.** E2E or test changes, build tooling, dependency bumps, internal readmes and developer docs do not belong in public release notes. Judge by whether a project manager or administrator would notice the change; if not, leave it out.
- A card sitting in **"Complete: Docs Required"** is explicitly flagged as awaiting release-notes coverage — treat that as a strong signal it belongs in the notes.
- Use the card's title, description, and comments for the human-readable framing of a feature — what it is and why it matters to a user.

### 2. Specs and code that landed in the release branch

Start with the specs that landed in this release: they describe the behaviour as the product intends it, which is how release notes should read. Then follow the same process across the rest of the repo to ground each claim and fill in missing detail, keeping the specs as the primary framing.

Find the spec delta for the version with git:

```
git fetch origin release/2.45
git fetch origin release/2.44
git diff --name-status origin/release/2.44...origin/release/2.45 -- specs/
```

**Diff from the merge base (three dots), not between the tips.** Tamanu keeps servicing older release branches after a newer one is cut, so a two-dot diff reads the previous version's hotfixes as this version's work.

Read each added or modified spec to understand the behaviour, and use `git log` on a spec path to recover the card and PR that introduced it.

Notes on refs:

- **Derive the previous release line from the branch list, don't assume it's `X.(YY-1)`.** List what actually exists and take the highest release branch below the target, so a skipped or unshipped minor can't send you to a branch that was never released:

  ```
  git branch -r --list 'origin/release/2.*' --sort=version:refname
  ```

  Confirm the line shipped by checking it has tags (`git tag --list 'v2.44.*'`). Compare against that branch so the delta is exactly this version's work, not an accumulation. State which refs you used.
- If `release/2.45` **hasn't been cut yet**, the work is still on `main` — use `origin/release/2.44...origin/main` instead, and say so. This is an upper-bound-free view: `main` may already carry work destined for a later version, so check each spec's introducing commit and drop anything that isn't part of the version being written up.

## Reconciling the two sources

The same piece of work often appears in both places — a spec-driven card usually originates from an issue in a tracker. Match them on the card id carried in the spec's introducing commits.

- **Committed specs are authoritative.** Where both describe the same work, the spec's description of the behaviour drives the write-up. Use the tracker card only for supporting framing (a readable title, the "why") and for version confirmation.
- **Tracker-only work** (labelled or staged for the version but with no spec that landed) is included once you've confirmed it actually shipped. The card's status is the first check; confirm it against the release branch by looking for its card id in the history, e.g. `git log --oneline origin/release/2.45 --grep TAM-6786`. If the work isn't in the branch, leave it out — a label alone is not evidence it shipped.
- **Never list the same feature twice.** One entry per piece of work, even where the same work appears in both trackers.

## Structuring the notes

Classify every included item into one of the six sections. Judge by significance and breadth, exactly as the v2.44 example does.

1. **Header** — `Released DD-MM-YYYY`, then one short paragraph naming the release's marquee items.
2. **🌟 Major Features and Changes** — the 3–4 most significant items, each with a real overview. Group by surface with `## ` headings, using only the surfaces that have content: **Tamanu Desktop**, **Tamanu Mobile**, **Patient Portal**, **System Administration**. Each feature is an `### _Italic title_` with an overview paragraph, a **Key features** bullet list, and a **Supporting documentation** list. Add **Security considerations** or a **Keen to implement …?** call-to-action block only where the feature warrants it (as the example does for the Patient Portal and integrations).
3. **🔧 System Enhancements** — smaller improvements. Same shape as major features but lighter; group related items; call out any configuration change.
4. **🐛 Tweaks and Bug Fixes** — everything else, **summarised at a high level**. Group by platform (`## Desktop`, `## Mobile`), with a `## System` group for backend, sync, and infrastructure fixes that aren't tied to one client. Within a group, one bullet per area (`**Bold label** - what improved`), rolling that area's fixes into a themed sentence or two. Do not enumerate individual fixes: a reader wants to know which areas got attention, not to read the commit log. Name a specific fix only where a PM would otherwise be surprised by the change.
5. **⚠️ Critical Upgrade Notes** — split **Required** and **Optional**, per feature. A checklist for a system administrator: what to review, decide, or set up around the upgrade, at two or three bullets per feature. Name settings keys and reference-data values so they can be found (e.g. `appointments.bookingSlots.slotDuration`, `isBookable`), but don't walk through the setup — the linked configuration guide carries the procedure. Say what happens if they don't act, where there is a consequence (a changed default, a feature that stays inert).
6. **Upgrade Steps and Recommended Testing** — split **Required** and **Optional**, per feature, closing with a **General** block. Concrete things a PM can test.

Give **Required** and **Optional** the same heading level as each other in both sections — `### Required` and `### Optional`. The v2.44 example sets Optional in bold rather than as a heading, which renders it inside the Required section; don't carry that across.

Separate major sections with `---` as the example does. Keep the emoji markers (🌟 🔧 🐛 ⚠️) — they are load-bearing.

## Supporting documentation links

You cannot generate real Slab URLs. Wherever the format expects a Supporting documentation link, leave a labelled placeholder for a human to fill:

```
**Supporting documentation**

- Feature overview - [SLAB_LINK_PLACEHOLDER]
- Configuration guide - [SLAB_LINK_PLACEHOLDER]
- User manual - [SLAB_LINK_PLACEHOLDER]
```

Keep the descriptive label before each placeholder so the person filling them in knows which document goes where.

## Voice and conventions

- **PM/admin audience.** Explain what a feature does, why it's useful, and how it fits a workflow. Leave out API specifics, database schemas, and internal architecture.
- **Benefits over mechanics.** "The system automatically removes conflicting location assignments" — not how it's implemented.
- **Australian/NZ English** — finalise, colour, organise, centralise, authorised.
- **Concise.** Match the example's density: a tight overview paragraph, then scannable bullets. No filler.

## Workflow

1. Resolve the version to its release branch, output path, and Linear label. Get the release date, or use the placeholder.
2. Read `example-v2-44.md` for the target shape.
3. Pull the tracker cards for the version — Linear's Tamanu team by version label, and Workhorse's Tamanu workspace by the card codes in the release branch.
4. [parallel with 3] Fetch the release branches and diff `specs/` to get the landed specs; read them; ground and deepen using the code changes as required; recover their cards/PRs from git log.
5. Reconcile the two sets on card id — committed specs win on overlap; tracker-only work is kept once confirmed shipped; dedup.
6. Classify each item into the six sections and draft the notes in the canonical format, leaving `[SLAB_LINK_PLACEHOLDER]` for every supporting-documentation link.
7. Write `docs/release-notes/vX-YY.md` (create `docs/release-notes/` on the first version).
8. Tell the user the path, and list what still needs a human: the Slab links, the release date if placeholdered, and anything you couldn't confidently classify.

## Source of truth

The committed specs and the Tamanu commit history are authoritative for what shipped; the trackers supply framing. This skill encodes the method, not a fixed answer — the surfaces, sections, and format can evolve. If the repo or a newer published release disagrees with this skill, the repo wins; update the skill and refresh the canonical example.
