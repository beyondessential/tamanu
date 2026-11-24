# Renaming a report

Server cases are covered in `packages/central-server/__tests__/admin/reports/reportRoutes.test.js`, UI cases in `packages/web/__tests__/views/administration/reports/RenameReportModal.test.jsx`.

## Renaming

- [x] Rename a report with versions; the definition carries the new name and its version count is unchanged (verifies spec: REPORTS)
- [x] Enter a name with surrounding spaces; it is saved trimmed (verifies spec: REPORTS)
- [x] Submit the report's own current name; the request succeeds and nothing changes
- [x] Submit a blank name; the request is rejected and the name is unchanged (verifies spec: REPORTS)
- [x] Submit a name another report uses; it is rejected with "Report name already exists" (verifies spec: REPORTS)
- [x] Submit a name a deleted report still uses; it is rejected with "A deleted report is still using this name" (verifies spec: REPORTS)
- [x] Rename a report ID that doesn't exist; the response is not found
- [ ] With the reporting schema enabled, a user without permission to edit the raw schema tries to rename a raw-schema report; it is rejected (verifies spec: REPORTS)

## Permissions

- [x] A user without permission to write report definitions calls the rename endpoint; it is forbidden and the name is unchanged (verifies spec: REPORTS)
- [x] A user without permission to write report definitions opens a report's edit screen; no rename button shows beside the name (verifies spec: REPORTS)

## Rename dialog

- [x] Click the rename button; the Rename report dialog opens with the current name filled in (verifies spec: REPORTS)
- [x] Change the name and save; the rename request is sent, a success toast shows and the dialog closes
- [x] Save a name the server rejects; an error toast shows and the dialog stays open
- [ ] After renaming, the edit screen's info card and the report list on the Edit tab show the new name without a page reload (verifies spec: REPORTS)
- [ ] After renaming, a facility that has synced lists the report under its new name (verifies spec: REPORTS)
- [ ] Run the renamed report and export it; the file name uses the new name (verifies spec: REPORTS)
