# Create new permission to restrict marking patient for sync

## Build steps

- [x] Register `SyncPatient: [Create]` in `PERMISSION_SCHEMA`
- [x] `POST /patientFacility`: require `read Patient` and `create SyncPatient`; refuse a facility other than the session's
- [x] Migration granting `create SyncPatient` to roles with `read Patient`, run on every server
- [x] Web: show the sync button only with the permission; otherwise show the not-synced message
- [x] Mobile: hide the sync status for an unsynced patient without the permission
- [x] Give the hardcoded `practitioner` role (dev/test permissions mode) `create SyncPatient`, matching the migration
- [x] Endpoint integration tests
- [x] Migration test
- [x] Web and mobile component tests
- [x] Test-cases file
- [x] Lint and run the touched test suites

## Rollout migration

Grant `create SyncPatient` to every role holding `read Patient`, so behaviour is unchanged at upgrade and restricted deployments opt out by marking `n` in their permissions sheet.

- Runs on every server, not central only. Migrations run with the sync tick trigger disabled, so a row inserted on central keeps tick 0, and its lookup stub heals at tick 0 too. Existing facilities would never pull it; only initial syncs would. Instead each server inserts the same rows from its own copy of `permissions` under deterministic IDs, following `1759894448776-migrateNoteTypesToReferenceData.ts`. Later changes on central bump the tick and update the rows in place. Mobile reads permissions from central at sign-in, so it needs nothing further.
- A facility whose copy of `permissions` is behind central at upgrade time (e.g. a role granted `read Patient` on central but not yet pulled) won't get that role's grant locally. Acceptable: upgrades normally follow a sync, and an administrator can grant it.
- DML only: one `INSERT ... SELECT` from `permissions` where `noun = 'Patient'`, `verb = 'read'`, `object_id IS NULL`, `deleted_at IS NULL`.
- IDs match `Permission.generatePermissionId`: `lower(role_id || '-create-syncpatient-any')`, with `ON CONFLICT DO NOTHING`.
- The admin role needs no row (it has `manage all`).
- `down` deletes rows by that ID pattern, which also removes any grants an admin made after upgrade. Mark it `// DESTRUCTIVE:`.
- The importer only touches cells the sheet fills in, so re-importing an older sheet won't remove the migrated rows.
- Release notes need to cover both directions, because permissions come entirely from each deployment's permissions sheet:
  - **Upgrading deployments**: the migration grants `SyncPatient` to every role with `read Patient`, so restricted sites revoke it (`n`) from the roles that shouldn't have it.
  - **New/implementing deployments**: the migration runs against an empty `permissions` table, so a greenfield site that imports a sheet without a `SyncPatient` column gets no grant at all and every desktop user sees the not-marked-for-sync message instead of the sync action. Their sheet needs a `SyncPatient` column with `create` for the roles that should have it.

## Endpoint facility check

`POST /patientFacility` takes `facilityId` from the body without checking it. Refuse the request when it differs from the session facility (`req.facilityId`, set in `middleware/auth.js`), alongside the `read Patient` and `create SyncPatient` checks. The web client already sends the session facility, so its call is unchanged.
