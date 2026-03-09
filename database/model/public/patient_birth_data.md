{% docs table__patient_birth_data %}
Information about the birth of the patient, if their birth was recorded into Tamanu.

This is specifically data about the newborn, and only the birth-relevant data.
Other patient data is found in the normal tables i.e. `patients`, `patient_additional_data`, etc.
{% enddocs %}

{% docs patient_birth_data__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).

There is at most one `patient_birth_data` row per patient.

Note that the `id` column is generated from this column to enforce this.
{% enddocs %}

{% docs patient_birth_data__birth_weight %}
Weight in kg at birth.
{% enddocs %}

{% docs patient_birth_data__birth_length %}
Length in cm at birth.
{% enddocs %}

{% docs patient_birth_data__birth_delivery_type %}
Type of delivery.

One of:
- `normal_vaginal_delivery`
- `breech`
- `emergency_c_section`
- `elective_c_section`
- `vacuum_extraction`
- `forceps`
- `other`
{% enddocs %}

{% docs patient_birth_data__gestational_age_estimate %}
Gestational age estimate (weeks).
{% enddocs %}

{% docs patient_birth_data__apgar_score_one_minute %}
[Apgar score](https://en.wikipedia.org/wiki/Apgar_score) one minute after birth.
{% enddocs %}

{% docs patient_birth_data__apgar_score_five_minutes %}
[Apgar score](https://en.wikipedia.org/wiki/Apgar_score) five minutes after birth.
{% enddocs %}

{% docs patient_birth_data__apgar_score_ten_minutes %}
[Apgar score](https://en.wikipedia.org/wiki/Apgar_score) ten minutes after birth.
{% enddocs %}

{% docs patient_birth_data__time_of_birth %}
Datetime of birth.
{% enddocs %}

{% docs patient_birth_data__birth_type %}
`single` or `plural` birth.
{% enddocs %}

{% docs patient_birth_data__attendant_at_birth %}
The type of the attendant at birth.

One of:
- `doctor`
- `midwife`
- `nurse`
- `traditional_birth_attentdant`
- `other`
{% enddocs %}

{% docs patient_birth_data__name_of_attendant_at_birth %}
Name of attendant at birth.
{% enddocs %}

{% docs patient_birth_data__birth_facility_id %}
Reference to the [facility](#!/source/source.tamanu.tamanu.facilities) the birth was recorded at.

This is only required when `registered_birth_place` is `health_facility`.
{% enddocs %}

{% docs patient_birth_data__registered_birth_place %}
Type of the actual birth place.

One of:
- `health_facility`
- `home`
- `other`
{% enddocs %}

{% docs patient_birth_data__time_of_birth_legacy %}
[Deprecated] Time of birth.
{% enddocs %}

{% docs patient_birth_data__birth_order %}
An integer that represents the birth order of the patient.
{% enddocs %}
