{% docs table__patient_allergies %}
List of allergies known of the patient.

In Tamanu this is displayed and entered in the patient view sidebar, under "Allergies".

See also: `public.patient_care_plans`, `public.patient_conditions`,
`public.patient_family_histories`, `public.patient_issues`.
{% enddocs %}

{% docs patient_allergies__note %}
Free-form description of this allergy.
{% enddocs %}

{% docs patient_allergies__recorded_date %}
Datetime at which this allergy was recorded.
{% enddocs %}

{% docs patient_allergies__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_allergies__practitioner_id %}
Reference to the [practitioner](#!/source/source.tamanu.tamanu.users) recording this allergy.
{% enddocs %}

{% docs patient_allergies__allergy_id %}
Reference to an allergy ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs patient_allergies__recorded_date_legacy %}
[Deprecated] Timestamp at which this allergy was recorded.
{% enddocs %}

{% docs patient_allergies__reaction_id %}
Reference to an allergic reaction ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}
