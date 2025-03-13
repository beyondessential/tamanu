## tasks

Tasks related to encounters

## encounter_id

Reference to the `encounter` this task is a part of.

## name

Name of the task.

## due_time

When the task is due.

## end_time

When the repeating task is end.

## requested_by_user_id

Reference to the `user` who requested this task.

## request_time

When the task is requested.

## status

Status of the task.

One of:
- `todo`
- `completed`
- `non_completed`

## note

Note of the task.

## frequency_value

Frequency value of the task (if the task is repeating), must go with frequency unit.

## frequency_unit

Frequency unit of the task (if the task is repeating).

One of:
- `minute`
- `hour`
- `day`

## high_priority

Boolean specify if the task is high priority.

## parent_task_id

Reference to the original `task` that the task is repeated from if it is a repeating task.

## completed_by_user_id

Reference to the `user` who marked this task as completed.

## completed_time

When the task is marked as completed.

## completed_note

Completed note of the task.

## not_completed_by_user_id

Reference to the `user` who marked this task as not completed.

## not_completed_time

When the task is marked as not completed.

## not_completed_reason_id

The reason (`Reference Data`) why this task is not completed.

## todo_by_user_id

Reference to the `user` who marked this task as to-do.

## todo_time

When the task is marked as to-do.

## todo_note

To-do note of the task.

## deleted_by_user_id

Reference to the `user` who delete this task.

## deleted_time

When the task is deleted.

## deleted_reason_id

The reason (`Reference Data`) why this task is deleted.

## deleted_reason_for_sync_id

The reason (`Reference Data`) why this task is deleted if it is deleted by the system.

