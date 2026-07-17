# SOP: Run a DB-defined report manually

Run a database-defined report by hand — to reproduce a failure surfaced by the
`report_errors` check / "Report Requests Failed" alert, or to check a report's
output. This runs report code in the central-server shell, so it is **[dev-OTS]**
(it executes application code against the live database; a report can be heavy).

## 1. Open the central-server shell

On the central host, from the current release folder:

```bash
cd <current Tamanu release>/packages/central-server
node --import tsx app shell
```

(Confirmed invocation: the `shell` script in
`packages/central-server/package.json` is `node --import tsx app shell`. Older
notes said `node dist shell`; use the `--import tsx app` form.)

## 2. Load the report definition by id

```javascript
report = await models.ReportDefinitionVersion.findOne({
  where: {
    reportDefinitionId: '7cf267cc-8512-45cc-b846-4c808e3cb46c',
    status: 'published',
  },
  order: [['versionNumber', 'DESC']],
})
```

## 3. Run it with parameters

```javascript
output = await report.dataGenerator(
  { models, sequelize: store.sequelize },
  {
    fromDate: '2024-07-10',
    toDate: '2024-07-12',
    facilityId: 'facility-LautokaHospital',
  },
)
```

## Notes

- The output may contain patient data — treat it as **sensitive-data**
  (`../ruled-out-actions.md`). Do not paste it into tickets or chat; redact.
- If you are chasing a specific failure, get the `report_requests` row first
  (`../runbooks/report-and-error-rows.md`) to see the parameters and error.
- Prefer read-only intent: this is for reproducing/inspecting, not for mutating
  data.
