{% docs table__patient_program_registration_conditions %}
Table of conditions related to patients in a program registration.
{% enddocs %}

{% docs patient_program_registration_conditions__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_program_registration_conditions__program_registry_id %}
Reference to the [Program Registry](#!/source/source.tamanu.tamanu.program_registries)
of the condition.
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
