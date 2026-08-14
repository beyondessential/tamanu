# Test cases — Chart history timestamps in local time

Covers the fix for chart edit-history timestamps rendering in UTC instead of the facility's local timezone.

## Chart edit history

- [ ] On a deployment whose primary timezone is not UTC (e.g. Pacific/Fiji), record a chart (e.g. Neurological Assessment), edit a measure, then open the cell's edit modal and check History — the entry timestamp shows the local time, with the correct meridiem (a PM edit reads as PM, not AM).
- [ ] The History entry timestamp matches the recorded-date column header for the same moment (both in local time), rather than being offset from it.
- [ ] Program registry charts show the same local-time history timestamps as encounter charts (both go through the same answers-with-history endpoint).
- [ ] Vitals edit history timestamps remain in local time (unchanged — vitals already store the log date in the primary timezone).

## Backend

- [ ] The `encounter/:id/charts/:surveyId` response returns each history log `date` as a naive `YYYY-MM-DD HH:MM:SS` string in the primary timezone (derived from `logs.changes.logged_at` converted from UTC), so the frontend's local-time formatting renders it correctly.
