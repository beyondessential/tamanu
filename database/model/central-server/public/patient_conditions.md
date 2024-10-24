{% docs table__patient_conditions %}
List of ongoing conditions known about a patient.

In Tamanu this is displayed and entered in the patient view sidebar, under "Ongoing conditions".

See also: `public.patient_allergies`, `public.patient_care_plans`,
`public.patient_family_histories`, `public.patient_issues`.
{% enddocs %}

{% docs patient_conditions__note %}
Free-form description of this condition.
{% enddocs %}

{% docs patient_conditions__recorded_date %}
Datetime at which this issue was recorded.
{% enddocs %}

{% docs patient_conditions__resolved %}
Whether the condition has resolved.
{% enddocs %}

{% docs patient_conditions__patient_id %}
Reference to the patient.
{% enddocs %}

{% docs patient_conditions__examiner_id %}
Reference to the practitioner diagnosing/recording this condition.
{% enddocs %}

{% docs patient_conditions__condition_id %}
Reference to a diagnosis describing this issue.
{% enddocs %}

{% docs patient_conditions__recorded_date_legacy %}
[Deprecated] Timestamp at which this issue was recorded.
{% enddocs %}

{% docs patient_conditions__resolution_date %}
Datetime at which this issue was resolved.
{% enddocs %}

{% docs patient_conditions__resolution_practitioner_id %}
Reference to the practitioner diagnosing/recording the resolution of this condition.
{% enddocs %}

{% docs patient_conditions__resolution_note %}
Free-form description or notes about the resolution of this condition.
{% enddocs %}
