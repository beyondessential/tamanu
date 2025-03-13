## report_definition_versions

A report definition containing the actual executable SQL query.

Report versions are immutable and changes to a report create a new version.

## version_number

The version number.

Version numbers are incrementing integers i.e 1,2,3,4.

The active version is determined by the highest `status = 'published'` version number

## notes

Free-form description or usage notes.

## status

Status of this version of the report.

One of:
- `draft`
- `published`

## query

The SQL query.

## query_options

JSON config containing additional options for the query.

- Form fields to allow customisation of the query when generating reports (query replacements)
- Default date range e.g. last 30 days
- Context for executing query e.g. this facility or all facilities (facility or central server)

## report_definition_id

The `report definition`.

## user_id

Reference to the `user` who saved this report version.

