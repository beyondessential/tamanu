{% docs logs__table__migrations %}
This table keeps track of when migrations are run.

The SequelizeMeta table in the public schema is internal migration state, and
only records which migrations are currently applied. This table instead logs
whenever migrations are performed, up and down, with additional timing info.
{% enddocs %}

{% docs logs__migrations__id %}
A randomly generated UUID.
{% enddocs %}

{% docs logs__migrations__logged_at %}
The local server time when the migration run happened.

This is an adjusted timestamp with microsecond precision: the adjustment offset
ensures that all Tamanu servers are reasonably in sync. However, it's rare that
servers have a dedicated high precision clock source, so the offset is computed
over the network; typically we expect better than 100ms synchronisation.
{% enddocs %}

{% docs logs__changes__device_id %}
The ID of the device.
{% enddocs %}

{% docs logs__changes__version %}
The Tamanu version.
{% enddocs %}

{% docs logs__migrations__record_sync_tick %}
The value of `currentSyncTick` in `local_system_facts` when the migrations ran.
{% enddocs %}

{% docs logs__migrations__direction %}
What kind of migration operation this was (typically `up`).
{% enddocs %}

{% docs logs__migrations__migrations %}
The list of migrations applied during this operation.
{% enddocs %}
