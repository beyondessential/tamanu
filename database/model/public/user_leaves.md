{% docs table__user_leaves %}
Records user leave requests, including leave period and scheduling/removal metadata.
{% enddocs %}

{% docs user_leaves__start_date %}
Start date of the leave.
{% enddocs %}

{% docs user_leaves__end_date %}
End date of the leave.
{% enddocs %}

{% docs user_leaves__user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who requested the leave.
{% enddocs %}

{% docs user_leaves__scheduled_by %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who scheduled the leave.
{% enddocs %}

{% docs user_leaves__scheduled_at %}
When the leave was scheduled.
{% enddocs %}

{% docs user_leaves__removed_by %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who removed the leave.
{% enddocs %}

{% docs user_leaves__removed_at %}
When the leave was removed.
{% enddocs %}
