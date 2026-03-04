# Queries

## Open PSQL with bestool

```
bestool tamanu psql
```

(Doesn't prompt for passwords etc as it pulls from config).

### Read-write mode

```
bestool tamanu psql -W
```

### Switch into read-write mode mid-session

Not recommended, prefer to quit and re-open as `-W`.

```
SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE;
```

### Login with another user (e.g. `postgres`)

```
bestool tamanu psql -U postgres
```

## Output query to a file

`\Copy (QUERY HERE) To 'C:\Tamanu\output.csv' With CSV DELIMITER ',' HEADER;`

## Metaprogramming

### Find all the tables that have linked records for a pair of encounters

```
\set e1id ff1ea017-f262-467f-9a1d-ea5707092d42
\set e2id 873d7f6b-8fbf-404d-90a2-614c9da3a714

select 'select ''' || table_name || ''', encounter_id, count(*) from '
  || table_name
  || ' where encounter_id in (:''e1id'', :''e2id'') group by encounter_id;'
from information_schema.columns
where column_name = 'encounter_id'
  and table_schema = 'public'
  and table_name != 'sync_lookup'
  and table_name not like '%archive%';
```

Then copy-paste the output of the query back into psql.

Remember that notes use `record_id` so need to be checked separately.

## Postgres

### Figure out which connections are blocked on which other connections

```sql
select pid, usename, pg_blocking_pids(pid) as blocked_by, query as blocked_query from pg_stat_activity where cardinality(pg_blocking_pids(pid)) > 0;
```

### Shorter output for all connections so the table is manageable

```sql
select datid, datname, pid, leader_pid, usename, application_name, client_port, wait_event, state, left(query, 40) from pg_stat_activity;
```

### Kill a connection by PID

```sql
SELECT pg_cancel_backend(1234), pg_terminate_backend(1234); commit;
```

The functions applies immediately but you need to `commit;` afterwards so queries to `pg_stat_activity` etc refresh.

### Given a connection PID figure out all the locks it's holding (and which relations those locks refer to)

```sql
select r.relname, l.* from pg_locks l left join pg_class r on r.oid = l.relation where l.pid = 1234;
```

# PM2

### Restart pm2 config

If you have to start the pm2.config.cjs file again, the steps you should run are:

- Open the console and `cd` into the current Tamanu release folder
- `pm2 kill`
- `pm2 start pm2.config.cjs`
- `pm2 save`

# Logs

## Streaming Caddy logs

If you want to stream minimal info from the caddy logs in a readable format, save this as a `.ps1` then run in powershell

Note that times will be in UTC

```
Get-Content -Path "C:\caddy\logs\server.log" -Wait | ForEach-Object {
    $_ | jq '{ time: (.ts | strftime("%Y-%m-%d %H:%M:%S")), ip: .request.remote_ip, duration: .duration, status: .status, uri: .request.uri }'
}
```

Or to look through an historical log file for a specific range of logs, use the following, changing the name of the log file and the start and end dates

```
$startDate = [DateTime]::Parse("2024-07-16T12:54:00")
$endDate = [DateTime]::Parse("2024-07-16T13:05:00")

Get-Content -Path "C:\caddy\logs\server-2024-07-16T15-22-25.879.log" | ForEach-Object {
    $log = $_ | ConvertFrom-Json
    $timestamp = [DateTime]::FromFileTimeUtc($log.ts * 10000000 + 116444736000000000)
    if ($timestamp -ge $startDate -and $timestamp -le $endDate) {
        $_
    }
} | jq '. | { time: (.ts | strftime("%Y-%m-%d %H:%M:%S")), ip: .request.remote_ip, duration: .duration, status: .status, uri: .request.uri }'
```

# Sync

## Checking sync status

These queries were used plenty when we were debugging sync stuff.

### Sessions

```
SELECT start_time, snapshot_completed_at - start_time as snapshot_duration, completed_at - start_time as full_duration, errors IS NOT NULL as is_error, debug_info->>'facilityId' as facility_id FROM sync_sessions ORDER BY updated_at DESC LIMIT 10;
```

### Last 10 errors

```sql
SELECT start_time, snapshot_completed_at - start_time as snapshot_duration, completed_at - start_time as full_duration, debug_info->>'facilityId' as facility_id, errors FROM sync_sessions WHERE errors IS NOT NULL ORDER BY updated_at DESC LIMIT 10;
```

### Last error expanded view

```sql
SELECT *, jsonb_pretty(debug_info::jsonb) as info FROM sync_sessions WHERE errors IS NOT NULL ORDER BY updated_at DESC LIMIT 1 \gx
```

### Snapshot

From the start of the query:

```
SELECT pid, current_timestamp - query_start as duration, state, datname, substr(query, 0, 500) FROM pg_stat_activity WHERE query NOT LIKE '%pg_stat_activity%' AND state is not null AND datname = 'tamanu_sync' AND query LIKE '%sync_snapshot%';
```

From the end of the query (e.g. to see which table it's on):

```
SELECT pid, current_timestamp - query_start as duration, state, datname, right(query, 200) FROM pg_stat_activity WHERE query NOT LIKE '%pg_stat_activity%' AND state is not null AND datname = 'tamanu_sync' AND query LIKE '%sync_snapshot%';
```

### How long sessions have been taking over the last day

```
WITH sync_status_aux as (SELECT completed_at - created_at as "duration", error IS NOT NULL as "is_error" FROM sync_sessions WHERE created_at > now() - interval '3 days') SELECT duration_range, COUNT(*) FROM (SELECT CASE WHEN duration >= interval '3 hours' THEN 'a - 3h+' WHEN duration >= interval '2 hours' AND duration < interval '3 hours' THEN 'b - 2-3h' WHEN duration >= interval '1 hour' AND duration < interval '2 hours' THEN 'c - 1-2h' WHEN duration >= interval '30 minutes' AND duration < interval '1 hour' THEN 'd - 30-59m' WHEN duration >= interval '10 minutes' AND duration < interval '1 hour' THEN 'e - 10-30m' WHEN duration >= interval '5 minutes' AND duration < interval '10 minutes' THEN 'f - 5-10m' WHEN duration >= interval '3 minutes' AND duration < interval '5 minutes' THEN 'g - 3-5m' WHEN duration >= interval '2 minutes' AND duration < interval '3 minutes' THEN 'h - 2m' WHEN duration >= interval '1 minute' AND duration < interval '2 minutes' THEN 'i - 1m' WHEN duration < '1 minute' THEN 'j - 1m-' END as "duration_range" FROM sync_status_aux WHERE is_error = FALSE) a GROUP BY a.duration_range;
```

### How long sessions using sync_lookup have been taking over the last day

```
WITH sync_status_aux as (SELECT completed_at - created_at as "duration", errors IS NOT NULL as "is_error" FROM sync_sessions WHERE debug_info->>'useSyncLookup' = 'true' AND created_at > now() - interval '3 days') SELECT duration_range, COUNT(*) FROM (SELECT CASE WHEN duration >= interval '3 hours' THEN 'a - 3h+' WHEN duration >= interval '2 hours' AND duration < interval '3 hours' THEN 'b - 2-3h' WHEN duration >= interval '1 hour' AND duration < interval '2 hours' THEN 'c - 1-2h' WHEN duration >= interval '30 minutes' AND duration < interval '1 hour' THEN 'd - 30-59m' WHEN duration >= interval '10 minutes' AND duration < interval '1 hour' THEN 'e - 10-30m' WHEN duration >= interval '5 minutes' AND duration < interval '10 minutes' THEN 'f - 5-10m' WHEN duration >= interval '3 minutes' AND duration < interval '5 minutes' THEN 'g - 3-5m' WHEN duration >= interval '2 minutes' AND duration < interval '3 minutes' THEN 'h - 2m' WHEN duration >= interval '1 minute' AND duration < interval '2 minutes' THEN 'i - 1m' WHEN duration < '1 minute' THEN 'j - 1m-' END as "duration_range" FROM sync_status_aux WHERE is_error = FALSE) a GROUP BY a.duration_range;
```

### Recent sessions for a facility (replace xxx with facility id)

```
SELECT start_time, snapshot_completed_at - start_time as snapshot_duration, completed_at - start_time as full_duration, errors IS NOT NULL as is_error, debug_info->>'facilityId' as facility_id FROM sync_sessions WHERE debug_info->>'facilityId' = 'xxx' ORDER BY updated_at DESC LIMIT 10;
```

### Last successful session for a facility (replace xxx with facility id)

```
SELECT start_time, snapshot_completed_at - start_time as snapshot_duration, completed_at - start_time as full_duration, errors IS NOT NULL as is_error, debug_info->>'facilityId' as facility_id FROM sync_sessions WHERE debug_info->>'facilityId' = 'xxx' AND errors IS NULL AND completed_at IS NOT NULL ORDER BY updated_at DESC LIMIT 10;
```



### Facility sync status changes over time (replace xxx with facility id, yyyy-mm-dd with start date to check from)

```
WITH sync_with_status AS (
  SELECT 
    completed_at,
    CASE 
      WHEN errors IS NULL THEN 'Successful'
      WHEN snapshot_started_at IS NOT NULL AND errors IS NOT NULL THEN 'Successful push, unsuccessful pull'
      ELSE 'Unsuccessful'
    END AS sync_status,
    debug_info->>'facilityId' as facility_id,
    ROW_NUMBER() OVER (ORDER BY start_time) as row_num
  FROM sync_sessions
  WHERE debug_info->>'facilityId' = 'xxx'
  AND completed_at IS NOT NULL
  ORDER BY completed_at
),
status_change AS (
  SELECT 
    s2.sync_status as status_changed_to,
    s2.completed_at as status_changed_at,
    s2.facility_id
  FROM sync_with_status s1
  JOIN sync_with_status s2 ON s1.row_num + 1 = s2.row_num
  WHERE s1.sync_status != s2.sync_status
)
SELECT 
  status_changed_to,
  status_changed_at,
  facility_id
FROM status_change
WHERE status_changed_at >= 'yyyy-mm-dd'
ORDER BY status_changed_at DESC;
```

Facility Sync Status

```
SELECT created_at, completed_at - created_at as duration, debug_info->>'facilityIds', errors IS NOT NULL as has_errors FROM sync_sessions ORDER BY created_at DESC LIMIT 10;
```

### Average sync lookup refresh for the last 2 hours	

```sql
	SELECT
	  AVG(EXTRACT(EPOCH FROM (info->>'completedAt')::timestamp - (info->>'startedAt')::timestamp)) AS avg_duration_seconds,
	  MIN(EXTRACT(EPOCH FROM (info->>'completedAt')::timestamptz - (info->>'startedAt')::timestamptz)) AS min_duration_seconds,
	  MAX(EXTRACT(EPOCH FROM (info->>'completedAt')::timestamptz - (info->>'startedAt')::timestamptz)) AS max_duration_seconds
	FROM (
	  SELECT info
	  FROM logs.debug_logs
	  WHERE type = 'syncLookupUpdate'
	  AND info->>'completedAt' IS NOT NULL
	  AND (info->>'startedAt')::timestamptz >= NOW() - INTERVAL '2 hours'
	  ORDER BY (info->>'startedAt')::timestamptz DESC
	) subquery;
```

### Sync lookup refreshes longer than a minute over the past day

```sql
 SELECT id, type, info, (info->>'completedAt')::timestamp - (info->>'startedAt')::timestamp as runtime FROM logs.debug_logs WHERE type = 'syncLookupUpdate' AND (info->>'startedAt')::timestamp > NOW() - INTERVAL '1 day' AND (info->>'completedAt')::timestamp - (info->>'startedAt')::timestamp > INTERVAL '1 minute' ORDER BY id DESC;
```

## Stopping a facility from syncing without causing downtime

- If the facility has a multi-process deployment:
    - Stop the `tamanu-sync` process on the facility side
- Otherwise, or if the facility isn't accessible for remote:
    - Ban its IP in caddy in central:

```
# under this line
encode zstd gzip

# put this, with the right IP
@denied client_ip 13.55.161.70/32
respond @denied 429
```

    - Then reload caddy.
    - Remember to unban it later

## When a facility server has been restored from backup

In this case there might be fkey conflict errors that don't make sense like somehow the server is not getting the rows it's requesting. This is probably due to the sync_lookup table for the device being "in the future" compared to the local sync status. An easy fix at the cost of longer sync for all devices for the next session is to truncate the sync_lookup table.

## Sync pull page limit is not scaling properly

You might see in the sync log something like

```
FacilitySyncManager.pull.pullingPage limit=52
FacilitySyncManager.pull.pullingPage limit=46
FacilitySyncManager.pull.pullingPage limit=38
FacilitySyncManager.pull.pullingPage limit=52
FacilitySyncManager.pull.pullingPage limit=46
FacilitySyncManager.pull.pullingPage limit=38
FacilitySyncManager.pull.pullingPage limit=52
```

This is characteristic of the limit scaling having entered a degenerate low loop. Bump the limits in the config:

```
"sync": {
		"dynamicLimiter": {
		  "initialLimit": 1000,
		  "minLimit": 100,
		  "maxLimit": 10000,
		  "optimalTimePerPageMs": 5000,
		  "maxLimitChangePerPage": 0.2,
		},
},
```

Something like this is fine for most servers and will dramatically improve sync pull performance.

# FHIR

## Large job queue

### How many jobs in queue/running

```
select count(*) from fhir.jobs where status != 'Errored';
```

### How many re-materialisations have occurred in the past 30 minutes

```
SELECT COUNT(*) 
FROM (
    SELECT id, last_updated FROM fhir.patients WHERE last_updated >= NOW() - INTERVAL '30 minutes'
    UNION ALL
    SELECT id, last_updated FROM fhir.practitioners WHERE last_updated >= NOW() - INTERVAL '30 minutes'
    UNION ALL
    SELECT id, last_updated FROM fhir.encounters WHERE last_updated >= NOW() - INTERVAL '30 minutes'
    UNION ALL
    SELECT id, last_updated FROM fhir.immunizations WHERE last_updated >= NOW() - INTERVAL '30 minutes'
    UNION ALL
    SELECT id, last_updated FROM fhir.service_requests WHERE last_updated >= NOW() - INTERVAL '30 minutes'
    UNION ALL
    SELECT id, last_updated FROM fhir.organizations WHERE last_updated >= NOW() - INTERVAL '30 minutes'
    UNION ALL
    SELECT id, last_updated FROM fhir.specimens WHERE last_updated >= NOW() - INTERVAL '30 minutes'
    UNION ALL
    SELECT id, last_updated FROM fhir.non_fhir_medici_report WHERE last_updated >= NOW() - INTERVAL '30 minutes'
) AS recent_updates;
```

# Alerts

## Disable an alert

Open the alert yml file and write at the top:

```
enabled: false
```

Remove the line to enable again.

Make sure you're in the right folder i.e. check which Tamanu version is latest.

## Disable all alerts

Disabling the scheduled task is the most straightforward way.

# Reports

## Manually running a DB-defined report

1. Open the shell:

```bash
cd \tamanu\release-v2.x.y\packages\central-server
npx node dist shell
```

1. Get report from ID:

```javascript
report = await models.ReportDefinitionVersion.findOne({
  where: {
    reportDefinitionId: '7cf267cc-8512-45cc-b846-4c808e3cb46c',
    status: 'published',
  },
  order: [['versionNumber', 'DESC']],
})
```

1. Run the report:

```javascript
output = await report.dataGenerator(
  { models, sequelize: store.sequelize },
  // parameters:
  {
    "fromDate": "2024-07-10",
    "toDate": "2024-07-12",
    "facilityId": "facility-LautokaHospital",
  }
)
```

# bestool

On Windows:

```
bestool
```

or

```
\Tamanu\bestool
```

On Linux:

```
bestool
```

## Update bestool

```
bestool self-update
```

## Short commands

From 0.28.5, you can shorten any command to its unambiguous prefix. For example:

```
bestool t p
```

This is because `tamanu` is the only top-level command that starts with `t`, and `psql` is the only `tamanu` subcommand that starts with `p`.

## PSQL

```
bestool tamanu psql
```

(Doesn't prompt for passwords etc as it pull from config).

## Dump merged config

```
bestool tamanu config -p facility-server
```

## Find the latest tamanu (useful in scripts)

```
bestool tamanu find -n1
```

For example, get the path to the alerts folder in the latest tamanu:

```
ls `bestool tamanu find -n1`/alerts
```

## Get a hash/checksums for a folder

Useful if you want to make sure there's no weird corruption happening

```
bestool crypto hash path/to/folder
```

## Detailed help for any bestool command

Just add `--help`:

```
bestool tamanu alerts --help
```

## Disabling materialised resources:

To disable any resources that should not be materialised, change this config in central

```
"resourceMaterialisationEnabled": {
    "Patient": true,
    "Encounter": false,
    "Immunization": false,
    "MediciReport": false,
    "Organization": false,
    "Practitioner": false,
    "ServiceRequest": false,
    "Specimen": false
}
```

## Senaite Integration Checklist:

1. Tamanu-Senaite Integration is having delays this morning as of 6:53am - [Slack Link](https://beyondessential.slack.com/archives/C022N48Q3JQ/p1730585548357829) 
    - Check if sync is working by query:
        - `select * from sync_sessions order by created_at desc limit 3;`
        - See if sync_sessions all have `completed_at` and no `errors`
    - Check if most recent lab requests are materialised
        - Select the most recent lab request
            - `select * from lab_requests order by created_at desc limit 1;`
        - Select from the `fhir.service_requests` and see if the lab request found above is materialised
            - `select * from fhir.service_requests where upstream_id = {lab_request_id from above}`
            - if no records found, it means materialisation is having some problem

## Report Query

```
SELECT * FROM report_requests WHERE id = 'xxx';
```

Run the above query  when receiving the Reports Requests Failed on Tamanu Alert.
