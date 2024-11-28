{% docs table__patient_issues %}
List of "other issues" known about a patient.

In Tamanu this is displayed and entered in the patient view sidebar, under "Other patient issues".

See also: `public.patient_allergies`, `public.patient_care_plans`, `public.patient_conditions`,
`public.patient_family_histories`.
{% enddocs %}

{% docs patient_issues__note %}
Free-form description of this issue.
{% enddocs %}

{% docs patient_issues__recorded_date %}
Datetime at which this issue was recorded.
{% enddocs %}

{% docs patient_issues__type %}
If set to `Warning`, an alert will pop up when visiting the patient.
{% enddocs %}

{% docs patient_issues__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_issues__recorded_date_legacy %}
[Deprecated] Timestamp at which this issue was recorded.
{% enddocs %}
