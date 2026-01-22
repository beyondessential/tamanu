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

{% docs appointments__start_time %}
When the appointment starts.
{% enddocs %}

{% docs appointments__end_time %}
When the appointment ends.
{% enddocs %}

{% docs appointments__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs appointments__clinician_id %}
Reference to the [clinician](#!/source/source.tamanu.tamanu.users) recording that appointment.
{% enddocs %}

{% docs appointments__location_id %}
The [location](#!/source/source.tamanu.tamanu.locations) where the appointment will take place.
{% enddocs %}

{% docs appointments__schedule_id %}
Reference to the [appointment schedule](#!/source/source.tamanu.tamanu.appointment_schedules) in the case of repeating appointments.
{% enddocs %}

{% docs appointments__status %}
The current status of the appointment record.

One of:
- `Confirmed`
- `Arrived`
- `No-show`
- `Cancelled`
{% enddocs %}

{% docs appointments__type_legacy %}
The legacy type of appointment.

One of:
- `Standard`
- `Emergency`
- `Specialist`
- `Other`
{% enddocs %}

{% docs appointments__start_time_legacy %}
[Deprecated] Start time.
{% enddocs %}

{% docs appointments__end_time_legacy %}
[Deprecated] End time.
{% enddocs %}

{% docs appointments__location_group_id %}
The [location group](#!/source/source.tamanu.tamanu.location_groups) where the appointment will take place.
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

{% docs appointments__additional_clinician_id %}
Reference to an additional [clinician](#!/source/source.tamanu.tamanu.users)
{% enddocs %}

{% docs appointments__link_encounter_id %}
Reference to the related [encounter](#!/source/source.tamanu.tamanu.encounters) of the appointment
{% enddocs %}
