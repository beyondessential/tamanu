{% docs table__appointments %}
Table of appointments.
{% enddocs %}

{% docs appointments__id %}
Tamanu identifier for appointment.
{% enddocs %}

{% docs appointments__start_datetime %}
Start date and time of the appointment.
{% enddocs %}

{% docs appointments__end_datetime %}
End date and time of the appointment.
{% enddocs %}

{% docs appointments__type %}
The type of appointment.
{% enddocs %}

{% docs appointments__start_time %}
TODO
{% enddocs %}

{% docs appointments__end_time %}
TODO
{% enddocs %}

{% docs appointments__patient_id %}
TODO
{% enddocs %}

{% docs appointments__clinician_id %}
TODO
{% enddocs %}

{% docs appointments__location_id %}
TODO
{% enddocs %}

{% docs appointments__type_legacy %}
The legacy type of appointment.

One of:
- `Standard`
- `Emergency`
- `Specialist`
- `Other`
{% enddocs %}

{% docs appointments__status %}
The current status of the appointment record.
{% enddocs %}

{% docs appointments__start_time_legacy %}
Legacy format of the start time kept for safety purposes.
{% enddocs %}

{% docs appointments__end_time_legacy %}
Legacy format of the end time kept for safety purposes.
{% enddocs %}

{% docs appointments__location_group_id %}
TODO
{% enddocs %}

{% docs appointments__booking_type_id %}
Reference to a [Reference Data](#!/source/source.tamanu.tamanu.reference_data)
(`type=bookingType`).
{% enddocs %}

{% docs appointments__appointment_type_id %}
Reference to a [Reference Data](#!/source/source.tamanu.tamanu.reference_data)
(`type=appointmentType`).
{% enddocs %}

{% docs appointments__is_high_priority %}
Boolean specify if the appointment is high priority.
{% enddocs %}

{% docs appointments__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) linked to this appointment
{% enddocs %}

{% docs appointments__schedule_id %}
Reference to the [appointment schedule](#!/source/source.tamanu.tamanu.appointment_schedules) in the case of repeating appointments.
{% enddocs %}
