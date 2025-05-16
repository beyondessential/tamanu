{% docs table__sync_sessions %}
Records of each user that can login to the site
{% enddocs %}

{% docs sync_sessions__id %}
Tamanu identifier for the sync session
{% enddocs %}

{% docs sync_sessions__start_time %}
Timestamp when sync session started
{% enddocs %}

{% docs sync_sessions__last_connection_time %}
Timestamp when sync session made last connection
{% enddocs %}

{% docs sync_sessions__snapshot_completed_at %}
Timestamp when sync session snapshot was completed
{% enddocs %}

{% docs sync_sessions__debug_info %}
Debug information for the sync session
{% enddocs %}

{% docs sync_sessions__completed_at %}
Timestamp when sync session was completed
{% enddocs %}

{% docs sync_sessions__persist_completed_at %}
Timestamp when sync session completion record is persisted
{% enddocs %}

{% docs sync_sessions__pull_since %}
Sync tick that the sync session pulled since
{% enddocs %}

{% docs sync_sessions__pull_until %}
Sync tick that the sync session pulled until
{% enddocs %}

{% docs sync_sessions__started_at_tick %}
Sync tick that the sync session started at
{% enddocs %}

{% docs sync_sessions__snapshot_started_at %}
Timestamp the sync session snapshot started at
{% enddocs %}

{% docs sync_sessions__errors %}
If a sync fails, the error(s).
{% enddocs %}

{% docs sync_sessions__min_source_tick %}
The minimum `source_start_tick` from SyncLookupTick records that fall within the sync session's pull range. Used to determine the lower bounds in filtering which changelog records should be pulled down to facilities.
{% enddocs %}

{% docs sync_sessions__max_source_tick %}
The maximum `lookup_end_tick` from SyncLookupTick records that fall within the sync session's pull range. Used to determine the upper bounds in filtering which changelog records should be pulled down to facilities.
{% enddocs %}
