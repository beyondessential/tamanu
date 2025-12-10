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
The ID of the change log row. UUID
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

{% docs logs__changes__logged_at %}
The timestamp this change was logged.
{% enddocs %}

{% docs logs__changes__created_at %}
Then sequelize metadata for the records created time
{% enddocs %}

{% docs logs__changes__updated_by_user_id %}
The value of the `updated_by_user_id` field of the change data.

This is extracted from the data to make it easier to query on.
{% enddocs %}

{% docs logs__changes__device_id %}
The `device_id` of the user behind the change
{% enddocs %}

{% docs logs__changes__version %}
The Tamanu version at time of change
{% enddocs %}

{% docs logs__changes__record_id %}
The value of the `id` field of the change data.

This is extracted from the data to make it easier to query on.
{% enddocs %}

{% docs logs__changes__record_created_at %}
The `created_at` metadata from record the changelog was recorded against
{% enddocs %}

{% docs logs__changes__record_updated_at %}
The `updated_at` metadata from record the changelog was recorded against
{% enddocs %}

{% docs logs__changes__record_deleted_at %}
The `deleted_at` metadata from record the changelog was recorded against
{% enddocs %}

{% docs logs__changes__record_data %}
The full row data of the change.

Note that as this is `JSONB`, some type information may be lost. However, row
data in a Tamanu system is transported using JSON via the sync system anyway, so
it is expected that all data trivially round-trips via JSON.
{% enddocs %}

{% docs logs__changes__reason %}
A string representing the reason for the change.
{% enddocs %}

{% docs logs__changes__migration_context %}
Stores a JSON string (as type TEXT) with migration context information
if the changelog was created from a migration.
{% enddocs %}
