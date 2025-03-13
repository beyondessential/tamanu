## sync_lookup

Cache of records to use for sync.

This is used internally in the sync process.

## record_id

The `id` field of the record.

## record_type

The table name of the record.

## data

All the fields of the record.

## patient_id

If the record has a `patient` reference, this is it extracted here.

This is used to filter records efficiently during the sync process.

## encounter_id

If the record has an `encounter` reference, this is it extracted here.

This is used to filter records efficiently during the sync process.

## facility_id

If the record has a `facility` reference, this is it extracted here.

This is used to filter records efficiently during the sync process.

## is_lab_request

Whether the record is or is related to a lab request.

This is used to filter records efficiently during the sync process.

## is_deleted

Whether the record is deleted (`deleted_at` is not null).

This is used to sort and filter records efficiently during the sync process.

## updated_at_by_field_sum

If the record has an `updatedAtByField`, the sum of those values.

This is used to sort and filter records efficiently during the sync process.

## pushed_by_device_id

The unique device that pushed this record.

