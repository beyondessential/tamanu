{% docs table__report_definitions %}
A name for a report.

This is what you see when selecting a report to generate in Tamanu.

The actual data is in [versions](#!/source/source.tamanu.tamanu.report_definition_versions).
{% enddocs %}

{% docs report_definitions__name %}
Human-friendly name of the report.
{% enddocs %}

{% docs report_definitions__db_schema %}
The name of the database schema (namespace) which is queried.

Defaults to `reporting`, which are standardised and normalised views designed specifically for
reporting; sometimes this is set to `public` to query the raw database directly.
{% enddocs %}
