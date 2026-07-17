# Runbook: report failures and error-row checks

A family of checks that each watch one table for rows with an error status in the
last hour: `report_errors`, `ips_errors`, `patient_communication_errors`,
`certificate_notification_errors`. Also the "Report Requests Failed" alert. They
share the same shape, so they share this runbook.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating. Read the check's
Canopy `get_check_documentation` first (`../healthchecks.md`); the Canopy solve
for all of these is essentially "check what the errors are" — this runbook is how
to do that.

## 1. When this applies

| Check / alert | Table watched | `FAIL` / `WARN` |
| --- | --- | --- |
| `report_errors` / "Report Requests Failed" alert | `report_requests` | `FAIL` >10 errored in last hour; `WARN` any |
| `ips_errors` | `ips_requests` | `FAIL` >10; `WARN` any |
| `patient_communication_errors` | `patient_communications` | `FAIL` >10; `WARN` any |
| `certificate_notification_errors` | `certificate_notifications` | `FAIL` >10; `WARN` any |

(FHIR job errors are covered separately in `fhir-queue-backlog.md`.)

## 2. Establish context

Which deployment (central), local time, Canopy notes —
`../deployment-context.md`. **[diagnose]**

## 3. Investigate

Central-side, read-only psql (`../sops/connect-psql.md`). The pattern is the
same for every check: read the errored rows and see what the error says.
**[diagnose]**

Report requests — the "Report Requests Failed" alert gives you an id, or list the
recent failures:

```sql
SELECT * FROM report_requests WHERE id = 'REPORT_REQUEST_ID';
```

```sql
SELECT id, report_type, status, error, created_at
FROM report_requests
WHERE status = 'Error'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

(`report_requests` has `report_type`, `status`, `error` — confirmed
`database/model/public/report_requests.yml`. The exact errored status string is
whatever the alert reports; adjust the `status` filter to match.
`[unverified]` — the literal error-status value is not pinned here.)

For the other three checks, read the equivalent errored rows and their error
column. `[unverified]` — the precise column names on `ips_requests`,
`patient_communications` and `certificate_notifications` are not pinned in this
runbook; inspect the table (`\d <table>`) and read the error/status columns
before quoting them.

## 4. Interpret

- **A handful of transient errors that stopped** — often a blip (a report that
  timed out once, a comms send that failed and retried). Note it; no action if it
  is not recurring.
- **A sustained stream of the same error** — a real fault: a broken report
  definition, a comms provider outage, a certificate/email misconfiguration. Read
  the error text to tell which.
- **Report-specific**: to reproduce or inspect a DB-defined report, see
  `../sops/run-db-report.md` (**[dev-OTS]** — it runs report code in a shell).

## 5. Resolve

These checks surface *symptoms*; the fix depends entirely on the error text, and
none of these tables has a safe support-level mutation. So:

- **Diagnose and route.** Read the error, decide whether it is transient or
  systemic, and hand a systemic fault to the owning area (reports, comms
  provider, certificate/email config). `[inferred — dev to confirm]`: the source
  (healthcheck solve) says only "check what the errors are" and "check if emails
  work" — there is no signed-off remediation beyond diagnosis, so escalate the
  fix rather than mutating these tables.
- **Do not** hand-edit or bulk-delete error rows to clear a check — that hides the
  fault. Not a support action.

## 6. Escalate

As in `sync-facility-stale.md` §6 — escalate when the fault is systemic and needs
a code, report-definition, or provider/config change, with a redacted summary of
the errors seen (no raw PII). For comms/certificate errors, confirm whether email
delivery itself is working before escalating.
