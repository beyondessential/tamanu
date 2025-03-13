## patient_death_data

Information about a patient's death.

## patient_id

The `patient` who died.

## clinician_id

Reference to the `clinician` who is recording this death.

## facility_id

Reference to the `facility` where this death is being recorded.

## manner

Free-form description of the manner of death.

## recent_surgery

Free-form description of the most recent surgery the patient received, if any.

## last_surgery_date

Datetime of the most recent surgery the patient received, if any.

## last_surgery_reason_id

Reference to a `diagnosis` (`Reference Data`) for the
reason of the most recent surgery the patient received, if any.

## external_cause_date

Datetime of external cause of death, if applicable.

## external_cause_location

Physical location of external cause of death, if applicable.

## external_cause_notes

Free-form description of external cause of death, if applicable.

## was_pregnant

Whether the deceased was pregnant.

## pregnancy_contributed

Whether the pregnancy contributed to the death.

## fetal_or_infant

Whether the deceased was themselves a foetus or infant.

## stillborn

Whether the deceased was themselves stillborn.

## birth_weight

If the deceased was a foetus, stillborn, or infant, their birth weight.

## within_day_of_birth

If the deceased was a foetus, stillborn, or infant, whether their passing was on the day of their birth.

## hours_survived_since_birth

If the deceased was an infant, how many days since the birth passed before their death.

## carrier_age

If the deceased was a foetus, stillborn, or infant, the age of the carrier.

## carrier_pregnancy_weeks

If the deceased was a foetus, stillborn, or infant, how many weeks pregnant their carrier was.

## carrier_existing_condition_id

If the deceased was a foetus, stillborn, or infant, any relevant existing condition
(`Reference Data`) of the carrier.

## outside_health_facility

Whether the death occurred outside of the facility.

## primary_cause_time_after_onset

The time in minutes after onset of the primary cause of death, if known.

## primary_cause_condition_id

Reference to the primary cause of death
(`Reference Data`), if known.

## antecedent_cause1_time_after_onset

The time in minutes after onset of an antecedent (1) cause of death, if applicable.

## antecedent_cause1_condition_id

Reference to an antecedent (1) cause of death
(`Reference Data`), if applicable.

## antecedent_cause2_time_after_onset

The time in minutes after onset of an antecedent (2) cause of death, if applicable.

## antecedent_cause2_condition_id

Reference to an antecedent (2) cause of death
(`Reference Data`), if applicable.

## external_cause_date_legacy

[Deprecated] Timestamp of external cause of death, if applicable.

## last_surgery_date_legacy

[Deprecated] Timestamp of the most recent surgery the patient received, if any.

## is_final

Whether this date record is final.

In Tamanu, this is set by a supervisor after review, and cannot be reversed; it causes all fields to
become read-only. The only way to undo this record is through a `death_revert_logs`.

## antecedent_cause3_time_after_onset

The time in minutes after onset of an antecedent (3) cause of death, if applicable.

## antecedent_cause3_condition_id

Reference to an antecedent (3) cause of death
(`Reference Data`), if applicable.

