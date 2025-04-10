{% docs table__patient_secondary_ids %}
Alternative IDs to be checked for when searching for patient by ID.

For example, driver licence or passport numbers, or other national or local health numbers, if there
are disparate systems or the country is in a transitional period.
{% enddocs %}

{% docs patient_secondary_ids__value %}
Value of the identifier.
{% enddocs %}

{% docs patient_secondary_ids__type_id %}
Reference to [Reference Data](#!/source/source.tamanu.tamanu.reference_data)
with `type=secondaryIdType`.
{% enddocs %}

{% docs patient_secondary_ids__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).

There may be zero or more `patient_secondary_ids` per patient.
{% enddocs %}
