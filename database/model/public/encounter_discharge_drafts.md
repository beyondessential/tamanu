{% docs table__encounter_discharge_drafts %}
A clinician's part-completed discharge form, saved so they can return to it after an interruption.

This is working state rather than clinical record: the discharge itself is only recorded in
[discharges](#!/source/source.tamanu.tamanu.discharges) when the form is finalised, at which point
every draft on the encounter is deleted. Each clinician has at most one live draft per encounter
and only ever sees their own. Drafts are facility-local and do not sync.
{% enddocs %}

{% docs encounter_discharge_drafts__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) being discharged.
{% enddocs %}

{% docs encounter_discharge_drafts__user_id %}
The [user](#!/source/source.tamanu.tamanu.users) whose working state this is. The draft is only
shown to this user, so one clinician's save cannot discard another's part-finished work.
{% enddocs %}

{% docs encounter_discharge_drafts__end_date %}
The discharge date and time as the clinician had entered it.
{% enddocs %}

{% docs encounter_discharge_drafts__discharger_id %}
The [user](#!/source/source.tamanu.tamanu.users) recorded as discharging the patient. Distinct from
`user_id`, which is whoever saved the draft.
{% enddocs %}

{% docs encounter_discharge_drafts__disposition_id %}
The discharge disposition ([Reference Data](#!/source/source.tamanu.tamanu.reference_data),
`type = dischargeDisposition`) as the clinician had selected it.
{% enddocs %}

{% docs encounter_discharge_drafts__note %}
The treatment plan and follow-up notes as the clinician left them.
{% enddocs %}

{% docs encounter_discharge_drafts__seeded_note_ids %}
The discharge planning [notes](#!/source/source.tamanu.tamanu.notes) whose content had already been
folded into `note` when the draft was saved.

Held by identity rather than by a saved-at timestamp so that resuming the draft appends only the
planning notes written since, and stays correct when a note is edited after the fact or arrives out
of order through synchronisation.
{% enddocs %}

{% docs encounter_discharge_drafts__ordering_clinician_id %}
The [user](#!/source/source.tamanu.tamanu.users) who would be recorded as the ordering prescriber on
the pharmacy order placed with the discharge.
{% enddocs %}
