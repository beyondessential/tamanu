{% docs table__tasks %}
Tasks related to encounters
{% enddocs %}

{% docs tasks__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this task is a part of.
{% enddocs %}

{% docs tasks__name %}
Name of the task.
{% enddocs %}

{% docs tasks__due_time %}
When the task is due.
{% enddocs %}

{% docs tasks__end_time %}
When the repeating task is end.
{% enddocs %}

{% docs tasks__requested_by_user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who requested this task.
{% enddocs %}

{% docs tasks__request_time %}
When the task is requested.
{% enddocs %}

{% docs tasks__status %}
Status of the task.

One of:
- `todo`
- `completed`
- `non_completed`
{% enddocs %}

{% docs tasks__note %}
Note of the task.
{% enddocs %}

{% docs tasks__frequency_value %}
Frequency value of the task (if the task is repeating), must go with frequency unit.
{% enddocs %}

{% docs tasks__frequency_unit %}
Frequency unit of the task (if the task is repeating).

One of:
- `minute`
- `hour`
- `day`
{% enddocs %}

{% docs tasks__high_priority %}
Boolean specify if the task is high priority.
{% enddocs %}

{% docs tasks__parent_task_id %}
Reference to the original [task](#!/source/source.tamanu.tamanu.tasks) that the task is repeated from if it is a repeating task.
{% enddocs %}

{% docs tasks__completed_by_user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who marked this task as completed.
{% enddocs %}

{% docs tasks__completed_time %}
When the task is marked as completed.
{% enddocs %}

{% docs tasks__completed_note %}
Completed note of the task.
{% enddocs %}

{% docs tasks__not_completed_by_user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who marked this task as not completed.
{% enddocs %}

{% docs tasks__not_completed_time %}
When the task is marked as not completed.
{% enddocs %}

{% docs tasks__not_completed_reason_id %}
The reason ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) why this task is not completed.
{% enddocs %}

{% docs tasks__todo_by_user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who marked this task as to-do.
{% enddocs %}

{% docs tasks__todo_time %}
When the task is marked as to-do.
{% enddocs %}

{% docs tasks__todo_note %}
To-do note of the task.
{% enddocs %}

{% docs tasks__deleted_by_user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who delete this task.
{% enddocs %}

{% docs tasks__deleted_time %}
When the task is deleted.
{% enddocs %}

{% docs tasks__deleted_reason_id %}
The reason ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) why this task is deleted.
{% enddocs %}

{% docs tasks__deleted_reason_for_sync_id %}
The reason ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) why this task is deleted if it is deleted by the system.
{% enddocs %}

{% docs tasks__duration_value %}
Numeric value specifying the expected duration of the task, must be used in conjunction with duration_unit.
{% enddocs %}

{% docs tasks__duration_unit %}
Unit of time for the task duration.

One of:
- `hours`
- `days`
- `occurrences`
{% enddocs %}

{% docs tasks__task_type %}
Type of the task.

One of:
- `normal_task`
- `medication_due_task`
{% enddocs %}
