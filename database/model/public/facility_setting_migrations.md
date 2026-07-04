{% docs table__facility_setting_migrations %}
Transient carrier for the config→settings migration on facility servers.

A facility server can't persist its own facility-scoped settings (those are pulled from
central), so the upgrade step writes each legacy config value here; the row pushes up and
central turns it into a facility-scoped [setting](#!/source/source.tamanu.tamanu.settings),
skipping keys that already have one. Rows are deleted from the facility once pushed, so
this table is normally empty.
{% enddocs %}

{% docs facility_setting_migrations__key %}
Dotted JSON path of the setting to create.
{% enddocs %}

{% docs facility_setting_migrations__value %}
JSON value from the legacy config file.
{% enddocs %}

{% docs facility_setting_migrations__facility_id %}
The [facility](#!/source/source.tamanu.tamanu.facilities) the setting is scoped to.
{% enddocs %}

{% docs facility_setting_migrations__device_id %}
For machine-level (server scope) carrier rows: the device id of the facility server the value came from. Null for facility-scoped rows, which use facility_id instead.
{% enddocs %}
