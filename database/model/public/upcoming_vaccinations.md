{% docs table__upcoming_vaccinations %}
A **view** which lists patients and next vaccine due for a given vaccine type.

The first dose of a vaccine type is based on weeks from birth due whilst subsequent doses are based on weeks from last 
vaccination due.

Age limits in years and thresholds in days for scheduled status are configurable with the following defaults:

- Age = 15
- Status: Scheduled = 28
- Status: Upcoming = 7
- Status: Due = -7
- Status: Overdue = -55
- Status: Missed = -Infinity
{% enddocs %}

{% docs upcoming_vaccinations__patient_id %}
The [patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs upcoming_vaccinations__scheduled_vaccine_id %}
Reference to the [scheduled vaccine](#!/source/source.tamanu.tamanu.scheduled_vaccines).
{% enddocs %}

{% docs upcoming_vaccinations__vaccine_category %}
Vaccine category [Routine, Catch-up, Campaign, Other]
{% enddocs %}

{% docs upcoming_vaccinations__vaccine_id %}
Reference to the vaccine ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = drug`).
{% enddocs %}

{% docs upcoming_vaccinations__due_date %}
Due date of the scheduled vaccine.
{% enddocs %}

{% docs upcoming_vaccinations__days_till_due %}
Number of days until the scheduled vaccine is due. Negative numbers indicates the number of days in the past the vaccine
was due.
{% enddocs %}

{% docs upcoming_vaccinations__status %}
Status of the upcoming vaccination listed ['DUE', 'OVERDUE', 'MISSED', 'SCHEDULED', 'UPCOMING']
{% enddocs %}
