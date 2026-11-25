---
id: REPORTS
---

# Reports

Applies to report definitions, generation, and exports.

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
