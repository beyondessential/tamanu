# Plan: reporting schema changes in the Draft release notes skill

## Decisions

- **Own section.** Reporting changes get a '📊 Reporting Schema Changes' section between 🐛 Tweaks and Bug Fixes and ⚠️ Critical Upgrade Notes, in both the markdown and the styled HTML. Breaking changes are also flagged under Critical Upgrade Notes (as a 'Reports' item) in plain language.
- **Names allowed in this section only.** Model, table and column names are written literally, as report writers need them to update custom reports. The no-coded-language rule still holds everywhere else, including the Critical Upgrade Notes entry.
- **Scope is the X.Y.0 tag.** Compare tamanu-source-dbt's `vX.Y.0` tag against the previous line's maintenance branch at the merge base (`origin/2.65...v2.66.0`). Later dbt patches on the X.Y line are out of scope. Derive the previous line from the branch list, as the skill already does for Tamanu.
- **What to read.** `models/` (bases, datasets, metrics, reports) and the report macros under `macros/`, excluding `models/sources` and `models/logs`, which are copied from Tamanu. Intermediate models are ephemeral and never reach the schema, so they are not listed, though what they change in a dataset is. Commit messages, the dbt repo's own `specs/` and MAUI tickets give the framing.
- **Shape.** An intro paragraph, then 'Breaking changes', 'New' and 'Changed' groups, one bullet per area. Supporting documentation points at the versioned reporting docs with `[REPORTING_DOCS_LINK_PLACEHOLDER]`.
- **Quiet releases.** Leave the section out when the reporting schema has no changes.
- **Access.** The skill needs a local clone of tamanu-source-dbt or the GitHub API. The web compare view can't render larger diffs.

## Mockup

`.workhorse/design/mockups/t11/v2-66-release-notes.html` shows the published v2.66 notes with the section added, sourced from the real `origin/2.65...v2.66.0` diff.

## Steps

- [ ] Add the reporting sourcing step and section shape to `.agents/skills/draft-release-notes/SKILL.md`
- [ ] Carve out the naming exception in Voice and conventions
- [ ] Add the section to the workflow and the six-section list (becoming seven)
- [ ] Add the `code` style and section to the styled HTML lineage
