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
{% enddocs %}

{% docs logs__migrations__record_sync_tick %}
TODO
{% enddocs %}

{% docs logs__migrations__device_id %}
TODO
{% enddocs %}

{% docs logs__migrations__version %}
TODO
{% enddocs %}

{% docs logs__migrations__direction %}
What kind of migration operation this was (typically `up`).
{% enddocs %}

{% docs logs__migrations__migrations %}
The list of migrations applied during this operation.
{% enddocs %}
