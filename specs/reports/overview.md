---
id: REPORTS
---

# Reports

Applies to report definitions, generation, and exports.

## Export file name

- An exported report's file name is `report-<date>-<report name>-<country name>`.
- The name is lowercased, and spaces become dashes, with consecutive dashes collapsed to one.
- This naming applies both to a report downloaded from this facility and to one emailed after running against all facilities, where it also names the zip and appears in the email that delivers it.

### Generic Survey Export

- The Generic Survey Export - Line List report's file name includes the name of the survey being exported, between the report name and the country name: `report-<date>-<report name>-<survey name>-<country name>`.
- The survey name is translated wherever the country name is.

> [!NOTE]
> Every export of this report otherwise carries the same name, so files from different surveys are indistinguishable until opened.

## Metadata tab

- An exported spreadsheet carries a metadata tab listing the report name, the date it was generated, the user who generated it, and the filters it ran with.
- A Generic Survey Export - Line List metadata tab has a Survey row directly after the filters, giving the name of the survey being exported.

## Report connections

- Every database-defined report runs against one of two reporting connections, chosen on its report definition: reporting, which reads the curated reporting schema, or raw, which reads the application's own tables.
- Each reporting connection logs in as its own database role, which can only read.
- The raw connection cannot read the tables that hold credentials, tokens and signing keys.
- A report's query runs only on its report's reporting connection.
- When the reporting connections are unavailable, such as when they could not be set up at startup, a database-defined report does not run and the request reports an error.

> [!NOTE]
> Report SQL is authored in the admin panel and arrives through sync, so it is held to read-only roles rather than trusted to be read-only itself.

## Saving a report version

- A new version of an existing report runs against that report's connection, whatever connection the request names.
- A report created by an import takes the connection that import declares, and an import naming a different connection from the report it is adding to is refused. An import that names no connection is a reporting one.
- Creating, importing or adding a version to a report on the raw connection needs permission to write the report schema.
- Creating or importing a version checks its query by planning it on the report's connection, without running it.
- A query is refused when it does not plan, when it holds more than one statement, or when its report has no configured reporting connection. The refusal gives the reason.
- Nothing is saved when the check refuses the query.
