# Report definitions sync from central only

Report definitions and their versions are authored on central and sync out to facility servers. These cases check both directions of that, and that the central admin flows are unchanged.

## Sync

- [x] Central rejects a sync session that pushes a report definition, marks the session errored, and saves nothing (verifies spec: REPORTS)
- [x] Central rejects a sync session that pushes a published report version, marks the session errored, and saves nothing (verifies spec: REPORTS)
- [x] Report definitions and versions created on central are added to the sync lookup that facilities pull from (verifies spec: REPORTS)
- [x] A push of a model that still syncs both ways persists rows that swap a unique value within one batch
- [ ] A facility server with report definitions already pulled keeps syncing normally after upgrading, with no rejected sessions

## Central administration

- [ ] Creating, importing and publishing a report version in the admin reports screen still works, and the version reaches a facility on its next sync (verifies spec: REPORTS)
- [ ] A published report runs on a facility server after it has synced
