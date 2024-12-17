{% docs table__user_preferences %}
Per-user preferences.
{% enddocs %}

{% docs user_preferences__user_id %}
The [user](#!/source/source.tamanu.tamanu.users) these preferences are for.
{% enddocs %}

{% docs user_preferences__encounter_tab_orders %}
Stores the tab encounter order that the user has adjusted
{% enddocs %}

{% docs user_preferences__selected_graphed_vitals_on_filter %}
In the Vitals views, graphs can be filtered. This is remembered per user.
{% enddocs %}

{% docs user_preferences__location_booking_filters %}
In the Location Bookings view, bookings can be filtered. This is remembered per user.
{% enddocs %}

{% docs user_preferences__outpatient_appointment_filters %}
The Outpatient Appointments view remembers the user’s applied filters and persists them between sessions.
Only the **Area** and **Booking type** filters are persisted, and the search bar for filtering by patient name or ID is cleared each time the page is loaded.
If a user hasn’t used these filters before, this attribute is `NULL`.
{% enddocs %}

{% docs user_preferences__clinician_dashboard_tasking_table_filter %}
In the Clinician dashboard, tasking tables can be filtered. This is remembered per user.
{% enddocs %}

{% docs user_preferences__outpatient_appointment_filters %}
In the outpatient appointments calendar, appointments can be filtered. This is remembered per user.
{% enddocs %}
