{% docs logs__table__dhis2_pushes %}
Audit logs for DHIS2 integration pushes.

This table tracks the results of automated pushes of report data to DHIS2 instances.
The DHIS2IntegrationProcessor scheduled task processes configured reports and pushes
their data to external DHIS2 systems. Each push attempt is logged here with details
about the success/failure status, import counts, and any conflicts encountered.

The table stores metadata about data synchronization operations including how many
records were imported, updated, ignored, or deleted during each push operation.
{% enddocs %}

{% docs logs__dhis2_pushes__id %}
UUID primary key for the push log entry.
{% enddocs %}

{% docs logs__dhis2_pushes__created_at %}
Timestamp of when the push log entry was created.
{% enddocs %}

{% docs logs__dhis2_pushes__report_id %}
The ID of the report that was pushed to DHIS2.
{% enddocs %}

{% docs logs__dhis2_pushes__status %}
The status of the push operation: "success", "failure", or "warning".
{% enddocs %}

{% docs logs__dhis2_pushes__imported %}
Number of records that were successfully imported to DHIS2.
{% enddocs %}

{% docs logs__dhis2_pushes__updated %}
Number of records that were updated in DHIS2.
{% enddocs %}

{% docs logs__dhis2_pushes__deleted %}
Number of records that were deleted from DHIS2.
{% enddocs %}

{% docs logs__dhis2_pushes__ignored %}
Number of records that were ignored during the push operation.
{% enddocs %}

{% docs logs__dhis2_pushes__updated_at %}
Timestamp of when the push log entry was last updated.
{% enddocs %}

{% docs logs__dhis2_pushes__deleted_at %}
Timestamp of when the push log entry was deleted (soft delete).
{% enddocs %}

{% docs logs__dhis2_pushes__conflicts %}
JSON array of conflict details encountered during the push operation.
{% enddocs %}

{% docs logs__dhis2_pushes__message %}
Human-readable message describing the result of the push operation.
{% enddocs %}
