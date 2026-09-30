# Create new permission to restrict marking patient for sync

## Rollout migration

Grant `create SyncPatient` to every role holding `read Patient`, so behaviour is unchanged at upgrade and restricted deployments opt out by marking `n` in their permissions sheet.

- Central only. `permissions` is pull-from-central, so the migration returns early on facility servers (guard with `selectFacilityIds(config)`, as in `1782024666353-cleanupFhirJobsOnFacilityServers.ts`). Facilities receive the rows on next sync; mobile picks them up at next sign-in.
- DML only: one `INSERT ... SELECT` from `permissions` where `noun = 'Patient'`, `verb = 'read'`, `object_id IS NULL`, `deleted_at IS NULL`.
- IDs match `Permission.generatePermissionId`: `lower(role_id || '-create-syncpatient-any')`, with `ON CONFLICT DO NOTHING`.
- The admin role needs no row (it has `manage all`).
- `down` deletes rows by that ID pattern, which also removes any grants an admin made after upgrade. Mark it `// DESTRUCTIVE:`.
- The importer only touches cells the sheet fills in, so re-importing an older sheet won't remove the migrated rows.
- Release notes need to tell restricted deployments to revoke `SyncPatient` from the roles that shouldn't have it.
