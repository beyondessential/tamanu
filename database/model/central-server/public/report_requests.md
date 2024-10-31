{% docs table__report_requests %}
Queued requests for reports by users.

Reports can be generated on-demand on the server a user is connected to, or it can be queued and
executed at the server's leisure, and then sent attached to an email.
{% enddocs %}

{% docs report_requests__report_type %}
If the report is defined in code, this is the code of that report.

Most reports are now created in SQL, but there are still a number of legacy reports that are
hardcoded in the Tamanu source code, and this is how they're referenced.
{% enddocs %}

{% docs report_requests__recipients %}
JSON array of email addresses.

Some legacy data may exist that specifies this as a comma-separated values.
{% enddocs %}

{% docs report_requests__parameters %}
JSON parameters for the report.
{% enddocs %}

{% docs report_requests__status %}
Processing status of the report request.

One of:
- `Received`
- `Processing`
- `Processed`
- `Error`
{% enddocs %}

{% docs report_requests__requested_by_user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) requesting this report generation.
{% enddocs %}

{% docs report_requests__error %}
If the report fails to process, the error.
{% enddocs %}

{% docs report_requests__process_started_time %}
When processing started.
{% enddocs %}

{% docs report_requests__facility_id %}
Reference to the [facility](#!/source/source.tamanu.tamanu.facilities) this report request is from.
{% enddocs %}

{% docs report_requests__export_format %}
The format the report results must be exported as.

One of:
- `xlsx`
- `csv`
{% enddocs %}

{% docs report_requests__report_definition_version_id %}
The [report version](#!/source/source.tamanu.tamanu.report_definition_versions) being generated.

Note that this is a version, not a report. If a report is updated after a request is queued, the
"old" version will be executed. Additionally, new versions must be synced to facilities to be usable.
{% enddocs %}
