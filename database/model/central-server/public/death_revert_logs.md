{% docs table__death_revert_logs %}
Patient deaths can be reverted if they were recorded in error, this tracks those reverts.

See [`patient_death_data`](#!/source/source.tamanu.tamanu.patient_death_data).
{% enddocs %}

{% docs death_revert_logs__revert_time %}
When the reversion happened.
{% enddocs %}

{% docs death_revert_logs__death_data_id %}
The [`patient_death_data`](#!/source/source.tamanu.tamanu.patient_death_data) record this is reverting.
{% enddocs %}

{% docs death_revert_logs__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs death_revert_logs__reverted_by_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who reverted this death record.
{% enddocs %}
