# Draft release notes skill — test cases

Concrete scenarios for verifying the `draft-release-notes` skill. A skill is a prompt, so these are run manually by invoking the skill against a real (or recent) Tamanu version and inspecting the drafted `docs/releasenotes/vX.YY.md`.

## Sourcing

- [ ] Given a version, the skill pulls Linear issues from the **Tamanu team** labelled with that version, and nothing from other teams.
- [ ] DataTrak / Tupaia work does not appear in the output.
- [ ] The skill diffs the version's `release/2.xx` branch against the previous minor's release branch and reads the `specs/` that landed there.
- [ ] When the `release/2.xx` branch isn't cut yet, the skill falls back to `origin/main` and states which refs it used.

## Reconciliation

- [ ] A feature that exists as both a Linear issue and a landed spec appears **once**, not twice.
- [ ] Where a Linear issue and a spec describe the same work, the write-up follows the **spec's** description of behaviour.
- [ ] Work labelled for the version in Linear but with no landed spec is still included.

## Format fidelity

- [ ] Output matches the six-section order from `example-v2.44.md`: header → 🌟 Major → 🔧 Enhancements → 🐛 Tweaks & Bug Fixes → ⚠️ Critical Upgrade Notes → Upgrade Steps and Recommended Testing.
- [ ] Major features are grouped by surface (Tamanu Desktop / Tamanu Mobile / Patient Portal / System Administration), using only surfaces with content.
- [ ] Tweaks and Bug Fixes lists **all** smaller items, grouped by platform.
- [ ] Critical Upgrade Notes and Upgrade Steps are each split Required / Optional.
- [ ] Emoji section markers (🌟 🔧 🐛 ⚠️) and `---` separators are present.

## Placeholders and output

- [ ] Every Supporting documentation link is left as `[SLAB_LINK_PLACEHOLDER]` with its descriptive label intact.
- [ ] The release date renders `DD-MM-YYYY`, or a clearly marked placeholder when unknown.
- [ ] The file is written to `docs/releasenotes/vX.YY.md`, creating `docs/releasenotes/` on the first run.

## Voice

- [ ] Overviews describe user-facing capability and benefit, with no API / schema / internal-architecture detail.
- [ ] Australian/NZ English spelling throughout.
