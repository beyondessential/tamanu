# QA loop log: U18 rename a report

Rigour: Standard (2 clean rounds in a row, the second cold; clean = no critical, at most 3 suggestions). Cap 8.
Base: `origin/main`. Commit under test at start: `594a57e31c`.
Work directory (not committed): `/home/rohan/.cache/workhorse-rig/beyondessential__tamanu/cards/u18/work`.

## In flight / next

- Round 1: all lenses but browser have reported. The browser lens is running against a leased build of `a3f73522f7`.
- A server fixer is working SEC-1, SEC-2, API-1/2, SEC-6 and TST-3; a web fixer follows it (one at a time, since they share the worktree).
- The tracked loop run lapsed when the earlier session ended, and an automation turn cannot reopen one, so rounds are recorded here rather than on the card's Loops bar.

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
| ARC-1 / COR-1 / NEI-1 | 1 | critical | bug | fixed | cursor[bot] `cmwu6vv3x06ei1fmp79t9dynr` | `a3f73522f7` | `packages/web/__tests__/views/administration/reports/EditReportView.test.jsx` |
| SEC-1 | 1 | critical | security | fixing | - | - | - |
| SEC-2 | 1 | suggestion | security | fixing | - | - | - |
| SEC-3 | 1 | suggestion | bug | decided | - | - | - |
| SEC-4 | 1 | nit | security | skipped | - | - | - |
| SEC-5 / CON-3 / COR-2 | 1 | suggestion | ui | fixing | - | - | - |
| SEC-6 / TST-3 | 1 | nit | coverage | fixing | - | - | - |
| API-1 / API-2 | 1 | nit | edge | fixing | - | - | - |
| API-3 | 1 | nit | edge | needs card | `cmwu7mrmq07i01fmpc9ehdxlq` | - | - |
| API-4 / API-5 / API-6 | 1 | nit | edge | skipped | - | - | - |

## Rounds

### Round 1

- The headline critical was found independently by three of this round's lenses and, separately, by cursor[bot] on the pull request: a rename refetched `['version', id]`, and because `EditReportView` rebuilt the editor's initial values from the new object (with fresh parameter ids from `withParameterIds`), Formik's `enableReinitialize` reset the form and discarded unsaved query, parameter, notes and status edits.
- Fixed in `a3f73522f7`: the editor's initial values are built once per version loaded, and the read-only name field takes the report's current name as a prop so a rename still shows straight away. The same reset also fired on an ordinary refetch (window focus), so the fix covers more than the rename.
- Regression test `EditReportView.test.jsx` was checked against the unfixed code and fails there.
**Decisions on findings not fixed**

- SEC-3: the rename keeps requiring the `write ReportDefinition` verb, though no other report route uses it and a role holding only create/read/list cannot rename. `write` is the correct verb for editing a definition, and it is one of the per-object verbs `OBJECT_ID_PERMISSION_SCHEMA` allows for this noun, which is what makes SEC-1's fix meaningful. The consequence is a deployment one: roles need the grant added. It belongs in the pull request description and the release notes.
- SEC-4: the collision messages confirm the existence of a raw-schema or soft-deleted report the caller cannot list. `POST /import` already behaves this way, the names carry no patient data, and collapsing the two messages would lose the guidance that makes the deleted-name case actionable.
- API-4, API-5, API-6: a no-op submit of a legacy untrimmed name performs a real update; concurrent renames are last-write-wins with no conflict signal, as elsewhere in the admin API; malformed JSON returns 500 from the global body parser, which is pre-existing and not this route's.

- Rigs and disk: the shared build of `594a57e31c` was collected after the session that was waiting on it ended; relaunched lenses are pinned to `a3f73522f7`. Free 129.8 GB, card 3.0 GB of 10 GB.
