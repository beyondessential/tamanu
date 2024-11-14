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

{% docs appointments__status %}
The current status of the appointment record.

One of:
- `Confirmed`
- `Arrived`
- `No-show`
- `Cancelled`
{% enddocs %}

{% docs appointments__type_legacy %}
TODO
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
TODO
{% enddocs %}

{% docs appointments__appointment_type_id %}
TODO
{% enddocs %}
