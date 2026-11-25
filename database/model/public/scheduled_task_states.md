{% docs table__scheduled_task_states %}
Run state of each scheduled task on the server, one row per task. A row records
whether the task has a run in progress and when it last started and finished a
run. The server reads it to tell its supervisor whether a scheduled task is
running before the server is put to sleep.

Operational state local to each server: never synced, and excluded from change
logging.
{% enddocs %}

{% docs scheduled_task_states__name %}
The name of the scheduled task, e.g. `OutpatientDischarger`.
{% enddocs %}

{% docs scheduled_task_states__running_since %}
When the task's current run started. Null while the task is not running. Cleared
when the run ends, whatever its outcome, and when the process that runs the task
starts.
{% enddocs %}

{% docs scheduled_task_states__last_started_at %}
When the task last started a run. Null if it has never started one.
{% enddocs %}

{% docs scheduled_task_states__last_finished_at %}
When the task last finished a run, whatever its outcome. Null if it has never
finished one.
{% enddocs %}
