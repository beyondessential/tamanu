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
