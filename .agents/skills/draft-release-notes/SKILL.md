---
name: draft-release-notes
description: >-
  Draft public Tamanu release notes for a given version. Use when the user wants release notes, a
  changelog, or "what's in vX.YY" for a Tamanu release (e.g. "draft release notes for v2.45"). Pulls
  work from two sources — Linear issues on the Tamanu team labelled with the version, and the committed
  specs that landed in that version's release/X.Y branch — reconciles them (committed specs are
  authoritative), and writes docs/releasenotes/vX.YY.md in the canonical v2.44 format for project
  managers and system administrators. Not for developer changelogs or QA test scoping (use
  scope-tamanu-release-tests for the latter).
label: "Draft release notes"
---

# Draft release notes

Produce **public release notes** for one Tamanu version and write them to `docs/releasenotes/vX.YY.md`.

The audience is **project managers and system administrators**, not developers. They read these notes to understand what new capabilities their teams gain, what workflows change, what configuration is required, and what to prepare and test before upgrading. Write to that audience throughout: user-facing capabilities and benefits, not implementation detail.

The canonical format is the published **v2.44** notes, kept alongside this skill at `example-v2.44.md`. Read it first — it is the reference for section order, headings, emoji markers, voice, and how much detail each section carries. A new draft should be indistinguishable in shape from that example.

## Input

The user specifies the **version** (e.g. `v2.45`, or `2.45`). Normalise it to:

- **Release branch** `release/2.45`
- **Output file** `docs/releasenotes/v2.45.md`
- **Linear version label** — the label for that version (often `v2.45.0`); confirm the exact label against the Tamanu team's labels rather than assuming.

Ask for the **release date** if the user hasn't given it. Format it `DD-MM-YYYY` in the header. If it's genuinely not known yet, leave `Released [RELEASE_DATE_PLACEHOLDER]`.

## Sourcing: two places to look

Work included in a version comes from **both** of these. Gather from each, then reconcile.

### 1. Linear — the Tamanu team

Pull issues that meet **all** of:

- On the **Tamanu** team.
- Labelled with the version (e.g. `v2.45.0`).

Filtering to the Tamanu team already excludes DataTrak, Tupaia, and other non-Tamanu product work — they live on separate teams. If you surface an issue that is clearly one of those, drop it.

Use each issue's title, description, and comments for the human-readable framing of a feature — what it is and why it matters to a user.

### 2. Workhorse — specs that landed in the release branch

A Workhorse card is part of a version when it **landed in that version's `release/2.xx` branch**. The committed specs are the content source for that work — read the specs, not card titles.

Find the spec delta for the version with git:

```
git fetch origin release/2.45 release/2.44
git diff --name-status origin/release/2.44..origin/release/2.45 -- specs/
```

Added (`A`) and modified (`M`) files under `specs/` are the work that landed in this version. Read each changed spec to understand the behaviour. Use `git log` on a spec path to recover the Linear card and PR that introduced it:

```
git log --oneline origin/release/2.44..origin/release/2.45 -- specs/administration/settings/secret-encryption.md
```

Notes on refs:

- If `release/2.45` **hasn't been cut yet**, the work is still on `main` — compare `origin/main` against the previous release branch instead, and say which refs you used.
- Compare against the **previous minor's** release branch so the delta is exactly this version's work, not an accumulation.
- `git fetch` does not create local branches — reference fetched branches as `origin/release/2.45`.

## Reconciling the two sources

The same piece of work often appears in both places — a spec-driven card usually originates from a Linear issue. Match them on the **Linear card id** (the spec's introducing commits reference it; the Linear issues carry it).

- **Committed specs are authoritative.** Where both describe the same work, the spec's description of the behaviour drives the write-up. Use the Linear issue only for supporting framing (a readable title, the "why") and for team/version confirmation.
- **Linear-only work** (labelled for the version but with no spec that landed) is still included — describe it from the issue.
- **Never list the same feature twice.** One entry per piece of work.

## Structuring the notes

Classify every included item into one of the six sections. Judge by significance and breadth, exactly as the v2.44 example does.

1. **Header** — `Released DD-MM-YYYY`, then one short paragraph naming the release's marquee items.
2. **🌟 Major Features and Changes** — the 3–4 most significant items, each with a real overview. Group by surface with `## ` headings, using only the surfaces that have content: **Tamanu Desktop**, **Tamanu Mobile**, **Patient Portal**, **System Administration**. Each feature is an `### _Italic title_` with an overview paragraph, a **Key features** bullet list, and a **Supporting documentation** list. Add **Security considerations** or a **Keen to implement …?** call-to-action block only where the feature warrants it (as the example does for the Patient Portal and integrations).
3. **🔧 System Enhancements** — smaller improvements. Same shape as major features but lighter; group related items; call out any configuration change.
4. **🐛 Tweaks and Bug Fixes** — everything else, **all of it listed**. Group by platform (`## Desktop`, `## Mobile`), each area a `**_Bold-italic heading_**` with terse bullets. Group related fixes together.
5. **⚠️ Critical Upgrade Notes** — split **Required** and **Optional**, per feature. Name settings keys and reference-data values literally here (e.g. `appointments.bookingSlots.slotDuration`, `isBookable`) — this is the one place concrete configuration belongs.
6. **Upgrade Steps and Recommended Testing** — split **Required** and **Optional**, per feature, closing with a **General** block. Concrete things a PM can test.

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
2. Read `example-v2.44.md` for the target shape.
3. Pull the Linear Tamanu-team issues for the version.
4. [parallel with 3] Fetch the release branches and diff `specs/` to get the landed specs; read them; recover their cards/PRs from git log.
5. Reconcile the two sets on card id — committed specs win on overlap; Linear-only work is kept; dedup.
6. Classify each item into the six sections and draft the notes in the canonical format, leaving `[SLAB_LINK_PLACEHOLDER]` for every supporting-documentation link.
7. Write `docs/releasenotes/vX.YY.md` (create `docs/releasenotes/` on the first version).
8. Tell the user the path, and list what still needs a human: the Slab links, the release date if placeholdered, and anything you couldn't confidently classify.

## Source of truth

The committed specs and the Tamanu commit history are authoritative for what shipped; Linear supplies framing. This skill encodes the method, not a fixed answer — the surfaces, sections, and format can evolve. If the repo or a newer published release disagrees with this skill, the repo wins; update the skill and refresh the canonical example.
