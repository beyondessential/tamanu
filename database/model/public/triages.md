{% docs table__triages %}
Triage data of patients waiting in an emergency department.
{% enddocs %}

{% docs triages__arrival_time %}
When the patient arrived.
{% enddocs %}

{% docs triages__triage_time %}
When the patient was triaged.
{% enddocs %}

{% docs triages__closed_time %}
When the patient was processed.
{% enddocs %}

{% docs triages__score %}
Classification done by the triage practitioner.
{% enddocs %}

{% docs triages__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this triage is for.
{% enddocs %}

{% docs triages__practitioner_id %}
Reference to the [practitioner](#!/source/source.tamanu.tamanu.users) assigned to this patient.
{% enddocs %}

{% docs triages__chief_complaint_id %}
Reference to the primary complaint ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = triageReason`).
{% enddocs %}

{% docs triages__secondary_complaint_id %}
Reference to the secondary complaint ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = triageReason`).
{% enddocs %}

{% docs triages__arrival_time_legacy %}
[Deprecated] When the patient arrived.
{% enddocs %}

{% docs triages__triage_time_legacy %}
[Deprecated] When the patient was triaged.
{% enddocs %}

{% docs triages__closed_time_legacy %}
[Deprecated] When the patient was processed.
{% enddocs %}

{% docs triages__arrival_mode_id %}
Reference to how the patient arrived ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = arrivalMode`).
{% enddocs %}
