{% docs table__task_templates %}
Template of tasks which then can be created upon
{% enddocs %}

{% docs task_templates__reference_data_id %}
The name of task template, referred to ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs task_templates__high_priority %}
Boolean specify if the task template is high priority.
{% enddocs %}

{% docs task_templates__frequency_value %}
Frequency value of the task template (if the task is repeating), must go with frequency unit.
{% enddocs %}

{% docs task_templates__frequency_unit %}
Frequency unit of the task template (if the task is repeating).

One of:
- `minute`
- `hour`
- `day`
{% enddocs %}
