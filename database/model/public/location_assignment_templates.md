{% docs table__location_assignment_templates %}
Templates for recurring location assignments that define when healthcare staff are scheduled to work at specific locations.
{% enddocs %}

{% docs location_assignment_templates__user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) assigned to this location.
{% enddocs %}

{% docs location_assignment_templates__location_id %}
Reference to the [location](#!/source/source.tamanu.tamanu.locations) where the user is assigned.
{% enddocs %}

{% docs location_assignment_templates__start_time %}
Start time of the daily assignment period.
{% enddocs %}

{% docs location_assignment_templates__end_time %}
End time of the daily assignment period.
{% enddocs %}

{% docs location_assignment_templates__repeat_end_date %}
Date when the repeating assignments should stop being generated.
{% enddocs %}

{% docs location_assignment_templates__repeat_frequency %}
Number of frequency units between each assignment (e.g., every 2 weeks).
{% enddocs %}

{% docs location_assignment_templates__repeat_unit %}
Frequency unit for repeating assignments.

One of:
- `WEEKLY`
- `MONTHLY`
{% enddocs %}
