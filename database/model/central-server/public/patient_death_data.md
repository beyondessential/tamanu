{% docs table__patient_death_data %}
Information about a patient's death.
{% enddocs %}

{% docs patient_death_data__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_death_data__clinician_id %}
Reference to the [clinician](#!/source/source.tamanu.tamanu.users) who is recording this death.
{% enddocs %}

{% docs patient_death_data__facility_id %}
Reference to the [facility](#!/source/source.tamanu.tamanu.facilities) where this death is being recorded.
{% enddocs %}

{% docs patient_death_data__manner %}
Free-form description of the manner of death.
{% enddocs %}

{% docs patient_death_data__recent_surgery %}
Free-form description of the most recent surgery the patient received, if any.
{% enddocs %}

{% docs patient_death_data__last_surgery_date %}
Datetime of the most recent surgery the patient received, if any.
{% enddocs %}

{% docs patient_death_data__last_surgery_reason_id %}
Reference to a `diagnosis` ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) for the
reason of the most recent surgery the patient received, if any.
{% enddocs %}

{% docs patient_death_data__external_cause_date %}
Datetime of external cause of death, if applicable.
{% enddocs %}

{% docs patient_death_data__external_cause_location %}
Physical location of external cause of death, if applicable.
{% enddocs %}

{% docs patient_death_data__external_cause_notes %}
Free-form description of external cause of death, if applicable.
{% enddocs %}

{% docs patient_death_data__was_pregnant %}
Whether the deceased was pregnant.
{% enddocs %}

{% docs patient_death_data__pregnancy_contributed %}
Whether the pregnancy contributed to the death.
{% enddocs %}

{% docs patient_death_data__fetal_or_infant %}
Whether the deceased was themselves a foetus or infant.
{% enddocs %}

{% docs patient_death_data__stillborn %}
Whether the deceased was themselves stillborn.
{% enddocs %}

{% docs patient_death_data__birth_weight %}
If the deceased was a foetus, stillborn, or infant, their birth weight.
{% enddocs %}

{% docs patient_death_data__within_day_of_birth %}
If the deceased was a foetus, stillborn, or infant, whether their passing was on the day of their birth.
{% enddocs %}

{% docs patient_death_data__hours_survived_since_birth %}
If the deceased was an infant, how many days since the birth passed before their death.
{% enddocs %}

{% docs patient_death_data__carrier_age %}
If the deceased was a foetus, stillborn, or infant, the age of the carrier.
{% enddocs %}

{% docs patient_death_data__carrier_pregnancy_weeks %}
If the deceased was a foetus, stillborn, or infant, how many weeks pregnant their carrier was.
{% enddocs %}

{% docs patient_death_data__carrier_existing_condition_id %}
If the deceased was a foetus, stillborn, or infant, any relevant existing condition
([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) of the carrier.
{% enddocs %}

{% docs patient_death_data__outside_health_facility %}
Whether the death occurred outside of the facility.
{% enddocs %}

{% docs patient_death_data__primary_cause_time_after_onset %}
The time in minutes after onset of the primary cause of death, if known.
{% enddocs %}

{% docs patient_death_data__primary_cause_condition_id %}
Reference to the primary cause of death
([Reference Data](#!/source/source.tamanu.tamanu.reference_data)), if known.
{% enddocs %}

{% docs patient_death_data__antecedent_cause1_time_after_onset %}
The time in minutes after onset of an antecedent (1) cause of death, if applicable.
{% enddocs %}

{% docs patient_death_data__antecedent_cause1_condition_id %}
Reference to an antecedent (1) cause of death
([Reference Data](#!/source/source.tamanu.tamanu.reference_data)), if applicable.
{% enddocs %}

{% docs patient_death_data__antecedent_cause2_time_after_onset %}
The time in minutes after onset of an antecedent (2) cause of death, if applicable.
{% enddocs %}

{% docs patient_death_data__antecedent_cause2_condition_id %}
Reference to an antecedent (2) cause of death
([Reference Data](#!/source/source.tamanu.tamanu.reference_data)), if applicable.
{% enddocs %}

{% docs patient_death_data__external_cause_date_legacy %}
[Deprecated] Timestamp of external cause of death, if applicable.
{% enddocs %}

{% docs patient_death_data__last_surgery_date_legacy %}
[Deprecated] Timestamp of the most recent surgery the patient received, if any.
{% enddocs %}

{% docs patient_death_data__is_final %}
Whether this date record is final.

In Tamanu, this is set by a supervisor after review, and cannot be reversed; it causes all fields to
become read-only. The only way to undo this record is through a `death_revert_logs`.
{% enddocs %}

{% docs patient_death_data__antecedent_cause3_time_after_onset %}
The time in minutes after onset of an antecedent (3) cause of death, if applicable.
{% enddocs %}

{% docs patient_death_data__antecedent_cause3_condition_id %}
Reference to an antecedent (3) cause of death
([Reference Data](#!/source/source.tamanu.tamanu.reference_data)), if applicable.
{% enddocs %}
