{% docs table__settings %}
Shared and synced configuration values.

Always set from the Central server / Admin interfaces and then synced to facilities.

Those can change dynamically when a server/client is up, some settings are read at point of use and
so change is applied "immediately", some settings are read once at server start but those should be
rare and eventually eliminated as there's no facility within Tamanu to restart its own servers.
{% enddocs %}

{% docs settings__key %}
Dotted JSON path.
{% enddocs %}

{% docs settings__value %}
JSON value.
{% enddocs %}

{% docs settings__facility_id %}
The [facility](#!/source/source.tamanu.tamanu.facilities) this setting is scoped to.
{% enddocs %}

{% docs settings__scope %}
Scope of the setting, which determines how it's applied.

One of:
- `global`
- `central`
- `facility`
{% enddocs %}
