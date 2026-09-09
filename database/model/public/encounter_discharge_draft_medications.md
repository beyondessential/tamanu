{% docs table__encounter_discharge_draft_medications %}
One medication line of a saved
[discharge draft](#!/source/source.tamanu.tamanu.encounter_discharge_drafts): what the clinician had
entered for a prescription before they were interrupted.

Lines are replaced wholesale each time the draft is saved, and are deleted with the draft when the
discharge is finalised.
{% enddocs %}

{% docs encounter_discharge_draft_medications__discharge_draft_id %}
Reference to the [discharge draft](#!/source/source.tamanu.tamanu.encounter_discharge_drafts) this
line belongs to.
{% enddocs %}

{% docs encounter_discharge_draft_medications__prescription_id %}
The [prescription](#!/source/source.tamanu.tamanu.prescriptions) this line is for.
{% enddocs %}

{% docs encounter_discharge_draft_medications__quantity %}
The discharge quantity as the clinician had entered it. Null where they had not yet filled it in.
{% enddocs %}

{% docs encounter_discharge_draft_medications__repeats %}
The number of repeats as the clinician had entered it. Null where they had cleared the field.
{% enddocs %}

{% docs encounter_discharge_draft_medications__send_to_pharmacy %}
Whether this medication was marked to be included in the pharmacy order placed with the discharge.
{% enddocs %}
