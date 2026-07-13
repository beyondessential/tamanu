---
name: upgrade-check
description: >-
  Check upgrade safety for a Tamanu upgrade that spans many versions: verify that every intermediate
  hotfix is included in the target version, and surface the new configuration/settings, data
  migrations, and FHIR rematerialisation impact the upgrade brings. Use when the user wants to check
  an upgrade from one Tamanu version to another (e.g. "check hotfixes from v2.31 to v2.47"), confirm no
  intermediate hotfix was dropped, or understand what config, migrations, and FHIR rework a multi-version
  jump requires. Handles Tamanu's train-release model (release/X.YY branches vs vX.YY.Z patch tags) and
  the cherry-pick model where the same logical fix has different SHAs on different branches. Purely
  git-based — no live database or Canopy access needed. Not for cutting a release (see
  release-cutoff-checks) or deciding which tests to run (see scope-tamanu-release-tests).
---

# Check a Tamanu upgrade across many versions

Given a "from" version and a "to" version for a Tamanu upgrade — often several minor versions apart
(e.g. `v2.31` -> `v2.47`) — verify the upgrade is safe and report what it entails. You are working
inside a clone of the Tamanu repo, so read the history directly with `git`. Three checks: hotfixes,
configuration/data requirements, and migrations/FHIR impact.

## How Tamanu releases work (read this first)

Tamanu uses a **train-release model**. Each minor version is cut from `main` as a long-lived branch
`release/X.YY` (e.g. `release/2.31`, `release/2.47`). Patch releases (`vX.YY.Z`) are tags/commits on
that branch. **Hotfixes** are commits landed on a release branch *after* its initial release (exclude
version-bump commits). If an intermediate branch was merged to `main` before the target branch was
created, its hotfixes are already inherited by the target.

## Critical matching rule

**NEVER compare by SHA** — hotfixes are cherry-picked, so the same fix has a different SHA on every
branch. **ALWAYS match by commit message subject** (the first line). A hotfix counts as **included**
if a commit with an equivalent subject exists in the target branch. Search far enough back (at least
50-100 commits) — cherry-picks are not always recent. Filter out version-bump and dependency-update
commits before comparing; they never need to be carried forward.

## Check 1 — Hotfixes Status

Verify all intermediate hotfixes are included in the target version. You must check **every** release
branch between current and target, not just the two endpoints. Upgrading `v2.31` -> `v2.47` means
checking `release/2.32`, `2.33`, ... `2.46` for hotfixes that might be missing from the target.

For **each** prior release branch:

1. Find the "last common commit" — typically when that branch was merged to `main` before the target
   branch was created.
2. Any commits on the prior branch **after** that last common commit are hotfixes to check.
3. For each hotfix, search the target branch for a commit with the same message subject.
4. If none is found, flag it as missing.

Output: a brief summary line (`All included` / `N missing from M branches`). Only list the missing
hotfixes, each with its branch and commit message.

## Check 2 — Configuration & Data Requirements

List what new configuration and data the upgrade requires, in three categories:

1. **New settings / environment variables** — new env vars or settings added between the versions,
   each with a one-line note on what it controls.
2. **New config requirements** — new server-config changes, feature flags, etc.
3. **New reference data** — new reference data, permissions, or data migrations that must be run.

For each category, list the items with a one-line description; if a category has none, say "None". Be
concise.

## Check 3 — Migrations & FHIR Impact

Report data-migration requirements and FHIR rematerialisation impact between the versions.

1. **Data migration subcommands** — list any subcommands that must be run
   (e.g. `yarn workspace lan-server migrate:subcommand:name`).
2. **Long-running migrations** — flag migrations that will be slow because they touch **every** (or
   most) rows in large tables (`encounters`, `notes`, `patients`, `sync_lookup`,
   `sync_session_data`, etc.). Slow patterns:
   - adding a `NOT NULL` column with a default (rewrites the whole table)
   - adding an index on a large table
   - `UPDATE` with no `WHERE`, or a broad `WHERE`
   - backfilling data across all/most rows
   Do **not** flag migrations that only update a small subset of rows.
3. **FHIR rematerialisation impact** — do **not** investigate the FHIR system; apply these rules
   directly. Tamanu uses database triggers on upstream tables to queue FHIR rematerialisation jobs;
   large-scale rematerialisation happens when a migration or reference-data change affects many rows
   in those upstream tables. Flag these patterns in migration diffs:

   a. **Reference-data changes** — INSERT/UPDATE/DELETE on `reference_data` for these types:
      - `drug` -> rematerialises FhirImmunization and FhirMedicationRequest. **Highest impact.**
      - `labTestPriority` -> rematerialises FhirServiceRequest
      - `bodySite`, `specimenType` -> rematerialises FhirSpecimen
      - `village` -> rematerialises FhirPatient (light impact)

   b. **Bulk upstream-table changes** — migrations that UPDATE/DELETE many rows in:
      - `patients`, `encounters` -> FhirPatient, FhirEncounter
      - `administered_vaccines` -> FhirImmunization
      - `lab_requests`, `lab_tests`, `imaging_requests` -> FhirServiceRequest
      - `pharmacy_orders`, `prescriptions` -> FhirMedicationRequest

   c. **FHIR builder code changes** — changes to
      `packages/database/src/utils/fhir/*/getValues.ts` require manual rematerialisation.

For each category, list items found; if none, say "None". If nothing triggers FHIR work, say "No FHIR
rematerialisation impact". Be concise.

## Output style

- No emojis.
- Be concise — summarise; do not list every commit.
- Present the three checks in order, each with its own summary line, then the details.

## Source of truth

The Tamanu commit history is authoritative. This skill encodes a method, not a fixed answer — branch
names, table names, and the FHIR trigger rules can change over time. If the repo disagrees with this
skill, the repo wins. Never decide a hotfix is present or missing from memory of a past release —
always read the actual history, and match by subject, never by SHA.
