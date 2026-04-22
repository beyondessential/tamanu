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
The sync tick at the time the migration log row was created, read from the
`local_system_fact` function. Used to order events relative to sync state.
{% enddocs %}

{% docs logs__migrations__device_id %}
The device identifier of the server that ran the migrations, read from the
`local_system_fact` function at insert time.
{% enddocs %}

{% docs logs__migrations__version %}
The Tamanu version of the server that ran the migrations, read from the
`local_system_fact` function at insert time.
{% enddocs %}

{% docs logs__migrations__direction %}
What kind of migration operation this was (typically `up`).
{% enddocs %}

{% docs logs__migrations__migrations %}
The list of migrations applied during this operation.
{% enddocs %}

{% docs logs__migrations__batch_duration_ms %}
Wall-clock duration (milliseconds) of the entire migration batch, including
pre-migration hooks, the migrations themselves, and post-migration hooks.
Nullable; absent on rows written before the stats columns were added.
{% enddocs %}

{% docs logs__migrations__upgrade_run_id %}
A UUID generated once per `upgrade` CLI invocation. All migration batch rows
produced during the same upgrade share this value, allowing them to be
correlated. Null when migrations are run via `just-migrate` (no upgrade context).
{% enddocs %}

{% docs logs__migrations__stats %}
JSONB object with per-batch diagnostics. Current shape:

- `durationMsPerMigration` — object mapping each migration file name to its
  individual duration in milliseconds (Umzug-reported wall time).
- `totalMigrationsDurationMs` — sum of all values in `durationMsPerMigration`.
- `preSnapshot` (optional) — approximate database state captured before the
  batch ran:
  - `databaseSizeBytes` — result of `pg_database_size`; `-1` if unavailable.
  - `tableRowEstimates` — object mapping public table names to approximate row
    counts from `pg_class.reltuples` (capped to the 500 largest tables).

Nullable; absent on rows written before the stats columns were added.
{% enddocs %}

{% docs logs__migrations__updated_at_sync_tick %}
The sync tick recorded when the row was last updated. Maintained by a trigger.
{% enddocs %}
