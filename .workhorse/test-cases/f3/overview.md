# Draft release notes skill — test cases

Concrete scenarios for verifying the `draft-release-notes` skill. A skill is a prompt, so these are run manually by invoking the skill against a real (or recent) Tamanu version and inspecting the drafted `docs/release-notes/vX.YY.md`.

A trial run against **v2.61** was done during development and its output landed at `docs/release-notes/v2.61.md`. Ticks below reflect that trial, which predates the Workhorse-tracker cases.

## Sourcing

- [x] Given a version, the skill pulls Linear issues from the **Tamanu team** labelled with that version, and nothing from other teams.
- [ ] The skill also pulls Workhorse cards for the version, resolved from the card codes in the release branch's commit history.
- [ ] A version whose work sits only in Workhorse (no Linear issues) is written up in full.
- [ ] A Workhorse card in a shipped status but absent from the release branch is not written up.
- [x] DataTrak / Tupaia work does not appear in the output.
- [x] The skill diffs the version's `release/2.xx` branch against the preceding release line and reads the `specs/` that landed there.
- [ ] When the `release/2.xx` branch isn't cut yet, the skill falls back to `origin/main` and states which refs it used.
- [ ] The preceding release line is derived from the actual branch list, not by assuming `X.(YY-1)`.
- [ ] The spec delta uses the three-dot form, so a spec changed on the older release branch after the newer one was cut is not attributed to this version.
- [ ] When `main` is the upper ref, specs belonging to a later version are dropped rather than written up.
- [ ] Cards that are cancelled, or still in progress, are excluded even when they carry the version label.
- [ ] Tracker-only work is confirmed present in the release branch history before being written up.
- [x] Internal / developer-only work (E2E, tooling, deps, internal readmes) is excluded from the notes.

## Reconciliation

- [ ] A feature that exists as both a tracker card and a landed spec appears **once**, not twice.
- [ ] Where a tracker card and a spec describe the same work, the write-up follows the **spec's** description of behaviour.
- [ ] Work staged for the version in a tracker but with no landed spec is still included.
- [ ] Work present in both Linear and Workhorse appears once.

## Format fidelity

- [ ] Output matches the six-section order from `example-v2.44.md`: header → 🌟 Major → 🔧 Enhancements → 🐛 Tweaks & Bug Fixes → ⚠️ Critical Upgrade Notes → Upgrade Steps and Recommended Testing.
- [ ] Major features are grouped by surface (Tamanu Desktop / Tamanu Mobile / Patient Portal / System Administration), using only surfaces with content.
- [ ] Tweaks and Bug Fixes lists **all** smaller items, grouped by platform.
- [ ] Critical Upgrade Notes and Upgrade Steps are each split Required / Optional, with both at the same heading level so Optional does not render inside Required.
- [ ] Emoji section markers (🌟 🔧 🐛 ⚠️) and `---` separators are present.

## Placeholders and output

- [ ] Every Supporting documentation link is left as `[SLAB_LINK_PLACEHOLDER]` with its descriptive label intact.
- [ ] The release date renders `DD-MM-YYYY`, or a clearly marked placeholder when unknown.
- [ ] The file is written to `docs/release-notes/vX.YY.md`, creating `docs/release-notes/` on the first run.
- [ ] Asked for a version that already has notes at `docs/release-notes/vX.YY.md`, the skill delivers the existing file instead of redrafting.

## Voice

- [ ] Overviews describe user-facing capability and benefit, with no API / schema / internal-architecture detail.
- [ ] Australian/NZ English spelling throughout.
