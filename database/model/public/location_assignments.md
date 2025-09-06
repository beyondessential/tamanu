{% docs table__location_assignments %}
Individual location assignment records representing specific time periods when healthcare staff are scheduled to work at particular locations.
{% enddocs %}

{% docs location_assignments__user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) assigned to this location.
{% enddocs %}

{% docs location_assignments__location_id %}
Reference to the [location](#!/source/source.tamanu.tamanu.locations) where the user is assigned.
{% enddocs %}

{% docs location_assignments__start_time %}
Start time of the assignment period.
{% enddocs %}

{% docs location_assignments__end_time %}
End time of the assignment period.
{% enddocs %}

{% docs location_assignments__template_id %}
Reference to the [location assignment template](#!/source/source.tamanu.tamanu.location_assignment_templates) that generated this assignment.
{% enddocs %}
