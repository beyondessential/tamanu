{% docs table__task_encounter_prescriptions %}
This table stores all encounter_prescriptions associated with tasks.
{% enddocs %}

{% docs task_encounter_prescriptions__task_id %}
References the unique identifier of the task. This links to the `tasks` table to provide context about the specific task.
{% enddocs %}

{% docs task_encounter_prescriptions__encounter_prescription_id %}
References the unique identifier of the encounter prescription. This links to the `encounter_prescriptions` table to provide context about the specific prescription within an encounter.
{% enddocs %}
