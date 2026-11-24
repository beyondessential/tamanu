# QA loop log: U18 rename a report

Rigour: Standard (2 clean rounds in a row, the second cold; clean = no critical, at most 3 suggestions). Cap 8.
Base: `origin/main`. Commit under test at start: `594a57e31c`.
Work directory (not committed): `/home/rohan/.cache/workhorse-rig/beyondessential__tamanu/cards/u18/work`.

## In flight / next

- Round 1: orient done, baseline and rig preflight running.

## Charter

### User-facing flows

| # | Who | Steps | Done looks like |
|---|---|---|---|
| F1 | Admin (write ReportDefinition) | Admin panel, Reports, Edit tab, pick a report, pick a version, click the pencil beside Name in the info card, change the name, Save | Toast "Report renamed to ...", dialog closes, info card shows the new name, the Edit tab's report list shows it, no new version |
| F2 | Admin | Open the rename dialog, then Cancel, Esc or close | Nothing changes; reopening shows the current name |
| F3 | Admin | Rename to a blank name, a name another report uses, a name a deleted report uses | Refused with a clear message, dialog stays open, typed text kept, name unchanged |
| F4 | User without write ReportDefinition | Open a report's edit screen; call the API directly | No pencil; API forbidden |
| F5 | Anyone running reports | After a rename, run/export the report on central and on a synced facility | The facility's report list and every export file name use the new name |

### API surface

- `PATCH /api/admin/reports/:reportId` body `{ name }` (central server, admin router). Needs `write ReportDefinition`. Where the reporting schema is enabled, a raw-schema report also needs `write ReportDbSchema`. Name trimmed, 1..255 chars, unique across all report definitions including soft-deleted. Returns `{ id, name }`.
- Neighbours read the name: `GET /api/admin/reports`, `GET /:reportId/versions/:versionId`, export, import (find-or-create by name), ReportRunner file names, facility report list.

### Data and state

- `report_definitions.name` (unique index, counts soft-deleted rows). Model syncs BIDIRECTIONAL, so a rename on central travels to facilities on next sync.
- Web react-query keys: `['version', versionId]`, `['reportList']`, `['reportVersions', reportId]`; `SelectReportView` keeps the selected report in local state.
- No migration.

### Risks, ranked

1. Authorisation: the write check, the raw-schema gate, permission variants (objectId-scoped ReportDefinition permissions), facility vs central.
2. Name integrity: uniqueness incl. soft-deleted, case and whitespace variants, unicode, length (255 limit vs column), concurrent renames, import by name after a rename.
3. Stale UI after rename: caches not invalidated, list state holding the old object, toast/version strings using the old name.
4. Sync: renamed name propagating (bidirectional model), conflict if a facility ever writes.
5. Dialog behaviour: double submit, keyboard, focus return, error handling keeping text, disabled save.
6. Spec and test-case accuracy.

### How to run the checks

- Central route tests: `cd packages/central-server && npm test -- __tests__/admin/reports/reportRoutes.test.js` (DB: docker container `u18-pg` on 127.0.0.1:5435 via git-ignored `config/local.json5`).
- Central admin suite: `npm test -- __tests__/admin`.
- Web unit tests: `cd packages/web && npx vitest run` (or a single file).
- Lint: `npx eslint <changed files>` from the repo root. No typecheck for these JS files.
- Web build: `npm run build --workspace @tamanu/web-frontend` (the rig also builds it).

### How to run the app

- `workhorse-local rig lease --holder qa-loop/<name> --holder-pid parent --ttl 4h` from the worktree; JSON gives `url` (facility-1 web), `info.adminUrl` (admin panel web pointed at central), `info.centralUrl`. Log in as admin@tamanu.io / admin.
- Browser: system Chrome via `playwright-core` in the work directory, `channel: 'chrome'` (smoke test passed; bundled chromium failed).

## Baseline

At `594a57e31c`: central `__tests__/admin` 28 files / 356 tests pass; web unit tests 142 files / 923 tests pass; eslint on changed files clean. No pre-existing failures. Browser: system Chrome via playwright-core passes the smoke test (bundled chromium fails).

## Rigs and disk

- Round 1 start: free 137.4 GB, 0 leases, card 0 KB of 10 GB, rig memory 0 of 15.3 GB.

## Findings ledger

| id | round | severity | kind | status | issue | commit | test |
|---|---|---|---|---|---|---|---|

## Rounds
