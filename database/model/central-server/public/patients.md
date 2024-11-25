{% docs table__patients %}
The central record for a patient.

⚠️ The full contents of this table are synced to all devices, and in larger deployments this may be
hundreds of thousands of records (or even millions), so it is critical to keep the row size small.

Only contains basic patient data (name, dob, etc.): the bare minimum to be able to find that patient
in the system from the search page.

The remainder of the patient data is stored in the `patient_additional_data` table, which is only
synced to a device once it has marked that patient for sync (in the `patient_facility` table).
{% enddocs %}

{% docs patients__display_id %}
Tamanu identifier for patients that is used on the front-end to refer to a patient.

It is usually the primary "health system" ID for this patient (ie something like a medicare number,
national healthcare number, etc), and may be imported from an external system or allocated by Tamanu
itself.

Informally this is called NHN or "Display ID" interchangeably.

Additional external IDs are tracked in the `patient_secondary_ids` table.
{% enddocs %}

{% docs patients__first_name %}
First name of patient
{% enddocs %}

{% docs patients__middle_name %}
Middle name of patient
{% enddocs %}

{% docs patients__last_name %}
Last name of patient
{% enddocs %}

{% docs patients__cultural_name %}
Cultural name of patient
{% enddocs %}

{% docs patients__email %}
Email address of patient
{% enddocs %}

{% docs patients__date_of_birth %}
Date of birth of patient
{% enddocs %}

{% docs patients__sex %}
Sex of patient.

One of:
- `male`
- `female`
- `other`
{% enddocs %}

{% docs patients__village_id %}
Tamanu village identifier defined in the reference data
{% enddocs %}

{% docs patients__additional_details %}
[Deprecated] Additional details of the patient
{% enddocs %}

{% docs patients__merged_into_id %}
Tamanu identifier for the patient the patient record was merged into
{% enddocs %}

{% docs patients__date_of_death_legacy %}
[Deprecated] Timestamp of death of patient
{% enddocs %}

{% docs patients__date_of_death %}
Date and time of death of patient
{% enddocs %}

{% docs patients__date_of_birth_legacy %}
[Deprecated] Timestamp of birth of patient
{% enddocs %}
