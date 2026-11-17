# Report query checks and connections

## Saving a report version

- [x] A valid read query, with and without parameters, passes the check (verifies spec: REPORTS)
- [x] A query that does not parse or plan is refused with the reason (verifies spec: REPORTS)
- [x] A query whose schema is missing, unknown or not a reporting connection is refused (verifies spec: REPORTS)
- [x] A query is refused when the reporting connections are unavailable (verifies spec: REPORTS)
- [x] A query holding a second statement is refused, and the second statement leaves no trace (verifies spec: REPORTS)
- [x] A query that would turn the plan into a run is refused, and leaves no trace (verifies spec: REPORTS)
- [x] A new version sent without a connection is checked against its report's connection (verifies spec: REPORTS)
- [x] A new version naming a different connection is still checked against its report's connection (verifies spec: REPORTS)
- [x] A version for a report that does not exist is refused as not found
- [x] Without permission to write the report schema, creating a raw report or adding a version to one is refused, and a reporting report can still be created (verifies spec: REPORTS)
- [x] A version whose query does not plan is refused over HTTP, and nothing is saved (verifies spec: REPORTS)
- [x] An import whose report names an unknown connection is refused, and nothing is saved (verifies spec: REPORTS)
- [x] A failure in reaching the reporting connection is not reported as an invalid query (verifies spec: REPORTS)
- [ ] In the admin panel, saving a version with an invalid query shows the reason and saves nothing (verifies spec: REPORTS)

## Importing a report from the command line

- [x] An imported report that does not exist yet is created on the connection its file declares (verifies spec: REPORTS)
- [x] An import naming a different connection from the existing report is refused (verifies spec: REPORTS)
- [x] The imported query is checked on that report's connection before the version is saved (verifies spec: REPORTS)
- [ ] `importReport` imports a report file end to end against a running database

## Running a report

- [x] A database-defined report runs on its reporting connection on a facility (verifies spec: REPORTS)
- [x] A report refuses to run when the reporting connections are unavailable (verifies spec: REPORTS)
- [x] Central's report runner and DHIS2 export still run reports on their reporting connections
- [ ] The facility `report` command runs a report from the command line
