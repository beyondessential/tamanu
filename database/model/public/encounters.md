{% docs table__encounters %}
Tracks the basic information of the patient encounters within Tamanu from start to finish
{% enddocs %}

{% docs encounters__encounter_type %}
The type of the encounter.

One of:
- `admission`
- `clinic`
- `imaging`
- `emergency`
- `observation`
- `triage`
- `surveyResponse`
- `vaccination`
- `medicationDispensing`
{% enddocs %}

{% docs encounters__start_date %}
The beginning of the encounter
{% enddocs %}

{% docs encounters__end_date %}
The date encounter was discharged/ended
{% enddocs %}

{% docs encounters__reason_for_encounter %}
Free-form information about the encounter.

Can include info like type of survey submitted, emergency diagnosis, etc.
{% enddocs %}

{% docs encounters__device_id %}
Unique identifier for the device that created the encounter.

Device IDs are proper to each device and not globally recorded in e.g. a `devices` table.
{% enddocs %}

{% docs encounters__start_date_legacy %}
[Deprecated] Start date.
{% enddocs %}

{% docs encounters__end_date_legacy %}
[Deprecated] End date.
{% enddocs %}

{% docs encounters__planned_location_id %}
The [location](#!/source/source.tamanu.tamanu.locations) that the encounter will transfer to at the
`planned_location_start_time`.
{% enddocs %}

{% docs encounters__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs encounters__examiner_id %}
Reference to the [examiner](#!/source/source.tamanu.tamanu.users).
{% enddocs %}

{% docs encounters__location_id %}
Reference to the current [location](#!/source/source.tamanu.tamanu.locations) this encounter is in.
{% enddocs %}

{% docs encounters__department_id %}
Reference to the [department](#!/source/source.tamanu.tamanu.departments) this encounter is in.
{% enddocs %}

{% docs encounters__planned_location_start_time %}
The time that the encounter will transfer to the planned location.
{% enddocs %}

{% docs encounters__patient_billing_type_id %}
The billing type ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) of the patient.
{% enddocs %}

{% docs encounters__referral_source_id %}
The referral source ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) of the patient.
{% enddocs %}

{% docs encounters__discharge_draft %}
Draft data of the encounter
{% enddocs %}

{% docs encounters__estimated_end_date %}
The estimated discharge date of the encounter
{% enddocs %}
