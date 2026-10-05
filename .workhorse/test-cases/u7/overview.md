# Patient issue note over 255 characters

`patient_issues.note` is widened from `varchar(255)` to unbounded `text`, matching the
`notes.content` precedent. The form already accepted long notes, so the fix is entirely
at the column and model level.

## Saving long notes

- [ ] Add a patient issue with a note over 255 characters — it saves without error
- [ ] Edit an existing patient issue's note to over 255 characters — it saves without error
- [ ] A note at exactly 255 characters still saves, as before
- [ ] A short note still saves, and the note remains optional at the database level

The first two are covered by endpoint tests in
`packages/facility-server/__tests__/apiv1/PatientIssue.test.js`. They are written but
unticked: the facility-server integration suite could not be run on this machine (see
note below), so they are not yet proven to pass.

## Display

- [ ] A long note displays in full in the "Other patient issues" sidebar section
- [ ] A `Warning`-type issue with a long note still raises the patient alert popup

## Migration

- [ ] Migration runs up on a database holding existing patient issues, preserving their notes
- [x] Migration converts the column to unbounded `text` and leaves the table's indexes intact
- [x] Migration `down` refuses when any note exceeds 255 characters (the destructive case),
      and succeeds once those rows are gone

The two ticked cases were verified by running the migration's `up` and `down` through a real
Sequelize `QueryInterface` against a scratch Postgres database.

## Sync

- [ ] A long note syncs from facility to central and back without truncation
- [ ] A long note syncs to mobile and displays there (SQLite does not enforce `varchar`
      length, so no mobile migration accompanies this change)

## Note on local verification

The facility-server integration suite does not run on this machine: `createTestContext()`
fails in `initDatabase()` with "Connection terminated unexpectedly" before any migration or
model code is reached. An unrelated suite (`Programs`) fails identically, and a plain
Sequelize connection to the same database with the same credentials succeeds, so this is a
local environment problem rather than a regression from this card.
