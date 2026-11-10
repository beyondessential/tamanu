{% docs table__sync_facility_runs %}
History of facility sync attempts, one row per attempt. A row is written as
`running` before the attempt contacts the central server and updated with the
outcome when it ends, so an attempt that hangs, or whose process dies, remains
visible as a `running` row with an old `start_time`. Used to alert on syncs that
are failing or not completing.

Operational state local to each facility server: never synced, and excluded from
change logging. The table exists on central servers too but is always empty there.
Rows are kept indefinitely.
{% enddocs %}

{% docs sync_facility_runs__status %}
Outcome of the attempt: `running` while in progress (or if it never completed),
`succeeded`, `queued` if the central server asked the facility to wait for a later
turn, or `failed`.
{% enddocs %}

{% docs sync_facility_runs__start_time %}
When the attempt started.
{% enddocs %}

{% docs sync_facility_runs__persist_started_at %}
When the attempt began saving the changes it pulled from the central server into
the facility database. Null if it never got that far.
{% enddocs %}

{% docs sync_facility_runs__persist_completed_at %}
When saving the pulled changes completed. Null while the save is in progress, or
if it never completed.
{% enddocs %}

{% docs sync_facility_runs__completed_at %}
When the attempt ended, whatever its outcome. Null while it is running, or if it
never completed.
{% enddocs %}

{% docs sync_facility_runs__session_id %}
The sync session the central server issued for this attempt. Null if the attempt
failed or was queued before a session was started.
{% enddocs %}

{% docs sync_facility_runs__trigger_type %}
What asked for the sync, e.g. `scheduled`, `userRequested`,
`patientMarkedForSync` or `subcommand`. Null for a follow-up sync run on behalf of
callers that asked while another sync was already in progress.
{% enddocs %}

{% docs sync_facility_runs__urgent %}
Whether the attempt asked the central server to be let in ahead of other queued
facilities.
{% enddocs %}

{% docs sync_facility_runs__error %}
The error message of a failed attempt. Null otherwise.
{% enddocs %}
