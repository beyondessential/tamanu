{% docs table__patient_family_histories %}
List of family history conditions known about a patient.

In Tamanu this is displayed and entered in the patient view sidebar, under "Family history".

See also: `public.patient_allergies`, `public.patient_care_plans`, `public.patient_conditions`,
`public.patient_issues`.
{% enddocs %}

{% docs patient_family_histories__note %}
Free-form description of this issue.
{% enddocs %}

{% docs patient_family_histories__recorded_date %}
Datetime at which this issue was recorded.
{% enddocs %}

{% docs patient_family_histories__relationship %}
Free-form description of the family relationship.
{% enddocs %}

{% docs patient_family_histories__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_family_histories__practitioner_id %}
Reference to the [practitioner](#!/source/source.tamanu.tamanu.users) recording this history.
{% enddocs %}

{% docs patient_family_histories__diagnosis_id %}
Reference to a diagnosis ([Reference Data](#!/source/source.tamanu.tamanu.reference_data))
describing this issue.
{% enddocs %}

{% docs patient_family_histories__recorded_date_legacy %}
[Deprecated] Timestamp at which this issue was recorded.
{% enddocs %}
