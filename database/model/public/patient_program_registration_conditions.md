{% docs table__patient_program_registration_conditions %}
Table of conditions related to patients in a program registration.
{% enddocs %}

{% docs patient_program_registration_conditions__program_registry_condition_id %}
Reference to the [Program Registry Condition](#!/source/source.tamanu.tamanu.program_registry_conditions).
{% enddocs %}

{% docs patient_program_registration_conditions__clinician_id %}
Reference to the [Clinician](#!/source/source.tamanu.tamanu.users) recording that condition.
{% enddocs %}

{% docs patient_program_registration_conditions__deletion_clinician_id %}
Reference to the [Clinician](#!/source/source.tamanu.tamanu.users) that removed the condition.
{% enddocs %}

{% docs patient_program_registration_conditions__reason_for_change %}
Optional field for recording the reason for changing the condition.
{% enddocs %}

{% docs patient_program_registration_conditions__patient_program_registration_id %}
Reference to the [Patient Program Registry](#!/source/source.tamanu.tamanu.patient_program_registrations)
of the condition.
{% enddocs %}

{% docs patient_program_registration_conditions__program_registry_condition_category_id %}
Reference to the [Program Registry Condition Category](#!/source/source.tamanu.tamanu.program_registry_condition_categories)
of the condition.
{% enddocs %}
