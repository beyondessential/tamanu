# Test cases: created_at / updated_at NOT NULL on changelog-logged tables

## Migration

- [x] A row with both timestamps NULL gets both filled by the backfill
- [x] A row with only created_at NULL takes created_at from its updated_at, and keeps that updated_at nudged by 1 microsecond
- [x] A row with both timestamps set is left untouched
- [x] After the migrations, created_at and updated_at are NOT NULL on every listed table
- [x] A healed row can be updated, and the changelog records the update
- [x] The down migrations restore each column's earlier nullability, and the migrations can run up again

## After the change

- [x] Inserting an explicit NULL created_at fails at write time, naming the column
- [x] An ORM create, and a raw insert that leaves the timestamps out, still get both timestamps
- [x] Every changelog-logged table has NOT NULL created_at and updated_at (schema test, catches new tables)
- [x] Registering a patient in a program registry succeeds when the patient already has a patient facility row for the registering facility, and that row keeps its created_at

## Manual

- [ ] On a copy of a real facility database, the upgrade completes and takes an acceptable time on the large tables (appointments, attachments, document_metadata, patient_additional_data, lab_request_logs)
