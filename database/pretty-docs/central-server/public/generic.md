## generic.schema

Contains the primary data for Tamanu.

This is the main namespace for Tamanu data. All contained here is generally regarded as the source
of truth within Tamanu, with data in other schemas being ether auxiliary or derived from this in
some way.

Despite the name, this schema is not accessible publicly via postgres, and requires authentication.

## id

Tamanu internal identifier (generally a UUID)

## created_at

Timestamp of when record was created

## updated_at

Timestamp of when record was last updated

## deleted_at

Timestamp of when record was deleted

## updated_by

The identifier of the user logged on when the record was created, updated or deleted

## date

Local date for the record

## datetime

Local date and time for the record

## start_datetime

Local start date and time for the record

## end_datetime

Local end date and time for the record

## date_legacy

[Deprecated] date field which is a timestamp of the event being recorded

## date_recorded

Local date and time of the event being recorded

## date_recorded_legacy

[Deprecated] date field which is a timestamp of the event being recorded

## deletion_date

Date field which is a timestamp of record being deleted

## visibility_status

The visibility status of the record.

- `current` indicates the record is currently in use and should be visible and accessible to users
  on the User Interface.
- `historical` indicates that the record is no longer in use and should not be visible nor
  accessible to users. However, the record may still be present in Reporting.
- `merged` indicates that the record has been merged, is no longer in use and should not be visible
  nor accessible to users.

The default value is `current`.

## updated_at_sync_tick

Last tick that the record was updated. Used to figure out old vs new data when syncing

