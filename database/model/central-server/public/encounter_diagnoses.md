{% docs table__encounter_diagnoses %}
Records diagnoses made during an encounter
{% enddocs %}

{% docs encounter_diagnoses__certainty %}
The level of certainty of the recorded diagnosis.

One of:
- `confirmed`
- `disproven`
- `emergency`
- `error`
- `suspected`

`disproven` and `error` are excluded for reporting
{% enddocs %}

{% docs encounter_diagnoses__is_primary %}
A boolean indicating if this is a primary diagnosis
{% enddocs %}

{% docs encounter_diagnoses__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this diagnosis is for.
{% enddocs %}

{% docs encounter_diagnoses__diagnosis_id %}
The diagnosis ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs encounter_diagnoses__clinician_id %}
Reference to the [clinician](#!/source/source.tamanu.tamanu.users) recording that diagnosis.
{% enddocs %}
