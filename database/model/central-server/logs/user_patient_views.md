{% docs logs__table__user_patient_views %}
An audit log of all intentional patient views by a user
{% enddocs %}

{% docs logs__user_patient_views__id %}
UUID
{% enddocs %}

{% docs logs__user_patient_views__viewed_by_id %}
The authenticated user viewing the patient
{% enddocs %}

{% docs logs__user_patient_views__patient_id %}
The patient record being accessed
{% enddocs %}

{% docs logs__user_patient_views__facility_id %}
The facility the user was logged in to when viewing patient
{% enddocs %}

{% docs logs__user_patient_views__session_id %}
The user session for this patient view
{% enddocs %}

{% docs logs__user_patient_views__logged_at %}
The time that the log was created
{% enddocs %}

{% docs logs__user_patient_views__context %}
A string identifier for the context that the user viewed the patient
{% enddocs %}
