---
name: scope-tamanu-release-tests
description: >-
  Produce a release test-impact analysis for a Tamanu version upgrade: compare two Tamanu releases and
  classify every functional area as Full Test, Smoke Test, or Skip, each with a short reason and the
  Linear card or PR reference. Use when the user wants a test plan, QA scope, regression scope, or "what
  to test" for a Tamanu release or upgrade, wants to compare or diff two Tamanu versions (e.g. v2.57 to
  v2.59), or asks which areas changed between two releases. Handles Tamanu's train-release model
  (release/X.Y branches vs vX.Y.Z tags) and maps changed files and PRs to Tamanu functional sections
  (Patient Management, Encounters/Charting, Surveys & Programs, Medications, Labs, Imaging, Appointments,
  Vaccinations, Sync, Settings, Reports, Admin/Permissions, Mobile, etc.). Optionally maps against a
  regression-testing spreadsheet's sections when one is provided.
---

# Scope a Tamanu release for testing

Produce a **test-impact analysis** for a Tamanu version upgrade: given a "from" and a "to" version, classify every functional area as **Full Test**, **Smoke Test**, or **Skip**, each with a one-line reason and the Linear card or PR it traces to. The output is a QA scoping table a release manager can act on directly, and it can be mapped onto an existing regression-testing spreadsheet's sections when one is supplied.

You are working inside a clone of the Tamanu repo, so read the history directly with `git`. The source of truth is the commit history; this skill encodes the method and the two things that trip people up — Tamanu's branch/tag topology, and keeping the classification honest about what actually changed.

## The mental model

1. **Resolve the two refs** for the "from" and "to" versions (these are not always tags — see the train-release model).
2. **Get the diff** — the commits, PRs, and changed files between the two refs.
3. **Map changes to sections** — group changed files/PRs by functional area via package path and conventional-commit scope.
4. **Classify each section** — Full / Smoke / Skip by the nature and breadth of the change, with a reason and a card/PR for every Full and Smoke.

## How Tamanu releases work (read this first)

Tamanu uses a **train-release model**. Each minor version is cut from `main` as a long-lived branch `release/X.Y` (package version `X.Y.0`) and only later published as a tag `vX.Y.Z` once it ships. Consequences:

- A version may **not be tagged yet** — it can exist only as `release/X.Y`. Check tags first (`git fetch origin --tags && git tag --list 'v*'`); use `vX.Y.Z` if present, otherwise compare against `release/X.Y`. State which ref you used for each side.
- Release branches are concurrent and can be cut at different dates, so lineage is not strictly linear; `main` is usually already on the next version.
- `CHANGELOG.md` is unmaintained — do not rely on it. Reconstruct the change list from commit history. Commits follow conventional commits (`feat(scope)`, `fix(scope)`, etc.) and start with or reference the Linear card (`TAM-1234`, `EPI-1321`, `KAM-463`, ...) and the PR number.

## Reading the diff

```
git fetch origin --tags
git fetch origin release/<from-minor> release/<to-minor>
git log --oneline --no-merges <from-ref>..<to-ref>      # commits + cards/PRs
git diff --stat <from-ref>..<to-ref>                     # changed files by package
git diff --name-only <from-ref>..<to-ref> -- packages/database/src/migrations   # new migrations
```

Pull the Linear card and PR number out of each commit subject so every Full/Smoke row can cite one.

## Tamanu functional sections

Map changes to these areas (packages: `central-server`, `facility-server`, `web`, `mobile`, `shared`, `database`):

| Section | Typical scopes / paths |
|---|---|
| Patient Management | `patients`, patient views, death/birth records |
| Encounters / Charting | `encounter`, `notes`, vitals, charts |
| Surveys & Programs / Forms | `survey`, `programs`, form question types |
| Medications / Pharmacy | `medication`, `pharmacy`, MAR, dispense |
| Labs / Imaging | `labs`, `imaging`, `fhir` (DiagnosticReport) |
| Appointments / Scheduling | `appointments`, `scheduling` |
| Vaccinations / Immunisations | `vaccine`, `immunisation` |
| Sync | `sync`, `shared/sync`, record sync |
| Reports | `reports`, report definitions |
| Admin / Permissions / Users | `auth`, `permissions`, `users`, roles |
| Settings | `settings`, config schema |
| Invoicing / Billing | `invoice`, `billing` |
| Referrals / Tasks / Locations | `referral`, `tasks`, `locations`, `departments` |
| Mobile | `packages/mobile/**` |
| Platform / Build / Infra | root configs, `.github`, deps, Node/build tooling |

## Classification rubric

- **Full Test** — significant new logic or broad-impact change: new features, new form/question types, changed data paths, new server routes, or framework upgrades that touch a whole surface (e.g. a React Native bump means full mobile regression). Anything that changes behaviour a user sees, or that touches data integrity.
- **Smoke Test** — contained or indirect changes: single bug fixes, perf tweaks, permission gating, dependency hardening, small type changes, or build/tooling changes (verify startup and installers). Enough to confirm nothing broke, not a full regression.
- **Skip** — no changes to that area.

Two signals:

- **Database migrations** (`packages/database/src/migrations`): a new migration means a schema/data change — Full Test the affected area plus migration/upgrade testing. No new migrations → say so; migration testing can be skipped.
- **Build/tooling churn** often dominates the file count but is low functional risk. Don't let raw file counts inflate the classification — call it out as a smoke pass over startup and installers.

## Workflow

1. **Resolve refs.** List tags; pick `vX.Y.Z` or `release/X.Y` for each side. Record which you used.
2. **Pull the diff.** `git log`/`git diff` between the refs; capture commit count, file count, and each commit's card/PR + scope.
3. [parallel with 2] **Check migrations.** Diff the `packages/database/src/migrations` listing between refs. Note any new files.
4. **Group by section.** Bucket every PR/commit into a section using scope + package path. If the user supplied a regression spreadsheet, map onto its sections instead of (or in addition to) the taxonomy.
5. **Classify.** Apply the rubric. Write a one-line reason and cite the Linear card or PR for every Full and Smoke section. List Skip sections plainly.
6. **Write the output** (format below). Lead with the refs compared, commit/file totals, and the migration finding.

## Output format

A short preamble (refs compared, totals, migration note), then three grouped tables:

```
## Regression Planning: v[from] -> v[to]
_Refs: <from-ref> -> <to-ref>. N commits, M files. Migrations: <new / none>._

### Full Test
| Section | Change | Card / PR |
|---|---|---|
| Medications / Pharmacy | New dispense workflow + dispensed-meds table | EPI-1321, #9939 |

### Smoke Test
| Section | Change | Card / PR |
|---|---|---|
| Labs | New resultsInterpretation field on lab requests | TAM-6840, #9997 |

### Skip
Login - Dashboard - Triage - ...

### Summary
- Full: N - Smoke: M - Skip: K
- Dominant change(s) and any risk notes.
```

If the user wants it as a file, offer a colour-coded spreadsheet (red = full, yellow = smoke, green = skip) and tell them the exact path it's written to. Every Full/Smoke row cites a real card or PR; never invent card numbers — if you can't find one, cite the PR# or commit scope. If an area's link to a change is indirect, prefer Smoke over Skip and say so.

## Source of truth

The Tamanu commit history is authoritative. This skill encodes a method, not a fixed answer — the functional sections and package layout can change. If the repo disagrees with this skill, the repo wins; update the skill. Never classify an area from memory of a past release — always read the actual diff for the versions asked about.
