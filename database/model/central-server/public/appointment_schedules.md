{% docs table__appointment_schedules %}
TODO
{% enddocs %}

{% docs appointment_schedules__start_date %}
TODO
{% enddocs %}

{% docs appointment_schedules__until_date %}
TODO
{% enddocs %}

{% docs appointment_schedules__interval %}
the recurrence interval

{% enddocs %}

{% docs appointment_schedules__frequency %}
How often the the recurrence occurs.

One of:
- `Weekly`
- `Monthly`
{% enddocs %}

{% docs appointment_schedules__days_of_week %}
Stores an array of ISO weekday abbreviations. 
Given `Weekly` frequency `days_of_week` determines the weekday that the repeated appointment occurs on. 
Given `Monthly` frequency `days_of_week` is combined with `nth_weekday` to determine the date in each month that the repeated appointment occurs on.

One of: 
- `MO`
- `TU`
- `WE`
- `TH`
- `FR`
- `SA`
- `SU`
{% enddocs %}

{% docs appointment_schedules__nth_weekday %}
Ordinal weekday for monthly recurrence interpreted with `days_of_week` as follows
- `1` with `days_of_week = ['Mo']` =  First Monday of the month
- `2` with `days_of_week = ['Tu']` =  Second Tuesday of the month
- `-1` with `days_of_week = ['Fr']` = Last Friday of the month

{% enddocs %}

{% docs appointment_schedules__occurrence_count %}
When this value is set, the recurrence ends after generating the specified number of occurrences
At least one of `occurrence_count` or `until_date` must be set.
{% enddocs %}
