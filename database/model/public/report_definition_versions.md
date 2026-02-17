{% docs table__report_definition_versions %}
A report definition containing the actual executable SQL query.

Report versions are immutable and changes to a report create a new version.
{% enddocs %}

{% docs report_definition_versions__version_number %}
The version number.

Version numbers are incrementing integers i.e 1,2,3,4.

The active version is determined by the highest `status = 'published'` version number
{% enddocs %}

{% docs report_definition_versions__notes %}
Free-form description or usage notes.
{% enddocs %}

{% docs report_definition_versions__status %}
Status of this version of the report.

One of:

- `draft`
- `published`
  {% enddocs %}

{% docs report_definition_versions__query_options %}
JSON config containing additional options for the query.

- Form fields to allow customisation of the query when generating reports (query replacements)
- Default date range e.g. last 30 days
- Context for executing query e.g. this facility or all facilities (facility or central server)
  {% enddocs %}

{% docs report_definition_versions__user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who saved this report version.
{% enddocs %}

{% docs report_definition_versions__advanced_config %}
Optional JSONB metadata for the report version.

Unlike `query_options`, this is not used when running the report query. It holds integration and
other non-query settings, for example:

- `dhis2DataSet`: DHIS2 data set ID used when pushing this report’s data to DHIS2 (see
  DHIS2 integration processor).
{% enddocs %}

{% docs report_definition_versions__query %}
The SQL query.
{% enddocs %}

{% docs report_definition_versions__report_definition_id %}
The [report definition](#!/source/source.tamanu.tamanu.report_definitions).
{% enddocs %}
