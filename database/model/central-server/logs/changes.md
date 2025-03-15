{% docs logs__table__changes %}
Contains a full log of all changes made to the core database records.

The changes are logged via triggers on source tables. The full row data is
logged in this table on every change to every row for every table that's covered.
These triggers are applied by Tamanu rather than being hardcoded in migrations.

Some tables are excluded from logging. These are listed in the `NON_LOGGED_TABLES`
constant in the database package, and include the sync subsystem and other
internal system tables.

Note that changes before this table was put in service will of course not have
been logged.
{% enddocs %}

{% docs logs__changes__id %}
The ID of the change log row. UUID.
{% enddocs %}

{% docs logs__changes__logged_at %}
The timestamp this change was logged.

This is an adjusted timestamp with microsecond precision: the adjustment offset
ensures that all Tamanu servers are reasonably in sync. However, it's rare that
servers have a dedicated high precision clock source, so the offset is computed
over the network; typically we expect better than 100ms synchronisation.
{% enddocs %}

{% docs logs__changes__device_id %}
The ID of the device this change was made on.
{% enddocs %}

{% docs logs__changes__version %}
The Tamanu version.
{% enddocs %}

{% docs logs__changes__table_oid %}
The Postgres OID of the table this change is from.

Postgres OIDs are much more precise than `schema.name`, and are not susceptible
to search path conflicts, so should be preferred for querying within the same
database. However, they are not easily relatable from outside the database, so
the schema and name fields are also recorded for those uses, plus human readers.
{% enddocs %}

{% docs logs__changes__table_schema %}
The schema (~database namespace) of the table this change is from.

This will typically be `public`; as of writing tables from other schemas are not
automatically logged.
{% enddocs %}

{% docs logs__changes__table_name %}
The name of the table this change is from.
{% enddocs %}

{% docs logs__changes__created_at %}
The value of the `created_at` field of the change data.

This is extracted from the data to make it easier to query on.
{% enddocs %}

{% docs logs__changes__updated_at %}
The value of the `updated_at` field of the change data.

This is extracted from the data to make it easier to query on.
{% enddocs %}

{% docs logs__changes__deleted_at %}
The value of the `deleted_at` field of the change data.

This is extracted from the data to make it easier to query on.
{% enddocs %}


{% docs logs__changes__author_id %}
The user who made the change.
{% enddocs %}

{% docs logs__changes__record_id %}
The value of the `id` field of the change data.

This is extracted from the data to make it easier to query on.
{% enddocs %}

{% docs logs__changes__record_update %}
Whether the change that resulted in this log entry was an `UPDATE` (true) or an
`INSERT` (false).

For any one `record_id`, there should always only be one `INSERT` change log.
In some cases it can be that `UPDATE` records from the same `record_id` _predate_
the `INSERT` log. Software reading the log should also tolerate the presence of
multiple `INSERT` entries for a single `record_id`, even if those should be
absent under normal conditions.
{% enddocs %}

{% docs logs__changes__record_sync_tick %}
The value of the `updated_at_sync_tick` field of the change data.

This is extracted from the data to make it easier to query on.
{% enddocs %}

{% docs logs__changes__record_data %}
The full row data of the change.

Note that as this is `JSONB`, some type information may be lost. However, row
data in a Tamanu system is transported using JSON via the sync system anyway, so
it is expected that all data trivially round-trips via JSON.
{% enddocs %}
