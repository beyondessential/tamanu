{% docs logs__table__m_supply_pushes %}
Audit logs for Open mSupply integration pushes.

This table tracks the results of automated pushes of dispensed medication data to Open mSupply instances.
The mSupplyMedIntegrationProcessor scheduled task sends pharmacy dispense records to external Open mSupply
systems via GraphQL. Each push attempt is logged here with details about the success/failure status,
the API response message, and item-level data returned by the integration.

The table stores metadata about each push batch including the range of medications included
(min/max id and created_at) so the processor can resume from the last successful push.
{% enddocs %}

{% docs logs__m_supply_pushes__id %}
UUID primary key for the push log entry.
{% enddocs %}

{% docs logs__m_supply_pushes__created_at %}
Timestamp of when the push log entry was created.
{% enddocs %}

{% docs logs__m_supply_pushes__updated_at %}
Timestamp of when the push log entry was last updated.
{% enddocs %}

{% docs logs__m_supply_pushes__deleted_at %}
Timestamp of when the push log entry was deleted (soft delete).
{% enddocs %}

{% docs logs__m_supply_pushes__status %}
The status of the push operation: "success" or "failed".
{% enddocs %}

{% docs logs__m_supply_pushes__message %}
Human-readable message describing the result of the push operation.
{% enddocs %}

{% docs logs__m_supply_pushes__items %}
JSON data returned by the Open mSupply API for the push (e.g. item-level results or details).
{% enddocs %}

{% docs logs__m_supply_pushes__min_medication_created_at %}
Earliest created_at among the dispensed medications included in this push batch.
{% enddocs %}

{% docs logs__m_supply_pushes__max_medication_created_at %}
Latest created_at among the dispensed medications included in this push batch.
{% enddocs %}

{% docs logs__m_supply_pushes__min_medication_id %}
ID of the first dispensed medication in this push batch (by createdAt, then id).
{% enddocs %}

{% docs logs__m_supply_pushes__max_medication_id %}
ID of the last dispensed medication in this push batch (by createdAt, then id).
{% enddocs %}
