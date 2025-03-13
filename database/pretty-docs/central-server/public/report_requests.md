## report_requests

Queued requests for reports by users.

Reports can be generated on-demand on the server a user is connected to, or it can be queued and
executed at the server's leisure, and then sent attached to an email.

## report_type

If the report is defined in code, this is the code of that report.

Most reports are now created in SQL, but there are still a number of legacy reports that are
hardcoded in the Tamanu source code, and this is how they're referenced.

## recipients

JSON array of email addresses.

Some legacy data may exist that specifies this as a comma-separated values.

## parameters

JSON parameters for the report.

## status

Processing status of the report request.

One of:
- `Received`
- `Processing`
- `Processed`
- `Error`

## requested_by_user_id

Reference to the `user` requesting this report generation.

## error

If the report fails to process, the error.

## process_started_time

When processing started.

## facility_id

Reference to the `facility` this report request is from.

## export_format

The format the report results must be exported as.

One of:
- `xlsx`
- `csv`

## report_definition_version_id

The `report version` being generated.

Note that this is a version, not a report. If a report is updated after a request is queued, the
"old" version will be executed. Additionally, new versions must be synced to facilities to be usable.

