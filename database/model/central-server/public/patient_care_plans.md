{% docs table__patient_care_plans %}
List of current care plans the patient is on.

In Tamanu this is displayed and entered in the patient view sidebar, under "Care plans".

See also: `public.patient_allergies`, `public.patient_conditions`, `public.patient_family_histories`,
`public.patient_issues`.
{% enddocs %}

{% docs patient_care_plans__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_care_plans__examiner_id %}
Reference to the [practitioner](#!/source/source.tamanu.tamanu.users) who prescribed this care plan.
{% enddocs %}

{% docs patient_care_plans__care_plan_id %}
Reference to the care plan ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}
