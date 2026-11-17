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
- [ ] In the admin panel, saving a version with an invalid query shows the reason and saves nothing (verifies spec: REPORTS)

## Running a report

- [x] A database-defined report runs on its reporting connection on a facility (verifies spec: REPORTS)
- [x] A report refuses to run when the reporting connections are unavailable (verifies spec: REPORTS)
- [x] Central's report runner and DHIS2 export still run reports on their reporting connections
- [ ] The facility `report` command runs a report from the command line
