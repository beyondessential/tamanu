{% docs table__encounter_diagnoses %}
Records diagnoses made during an encounter
{% enddocs %}

{% docs encounter_diagnoses__id %}
Tamanu identifier for diagnoses recorded during an encounter
{% enddocs %}

{% docs encounter_diagnoses__certainty %}
The level of certainty of the recorded diagnosis ['confirmed', 'disproven', 'emergency', 'error', 'suspected'].
`disproven` and `error` are excluded for reporting
{% enddocs %}

{% docs encounter_diagnoses__is_primary %}
A boolean indicating if this is a primary diagnosis
{% enddocs %}

{% docs encounter_diagnoses__datetime %}
Date and time the diagnosis was recorded
{% enddocs %}

{% docs encounter_diagnoses__encounter_id %}
TODO
{% enddocs %}

{% docs encounter_diagnoses__diagnosis_id %}
TODO
{% enddocs %}

{% docs encounter_diagnoses__clinician_id %}
TODO
{% enddocs %}
