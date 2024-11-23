{% docs table__notifications %}
Notifications for the clinician dashboard
{% enddocs %}

{% docs notifications__type %}
Type of the notification

One of:
- `imaging_request`
- `lab_request`
{% enddocs %}

{% docs notifications__status %}
Status of the notification

One of:
- `unread`
- `read`
{% enddocs %}

{% docs notifications__user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) that get the notification.
{% enddocs %}

{% docs notifications__created_time %}
When the notification was created
{% enddocs %}

{% docs notifications__patient_id %}
Related patient of the notification
{% enddocs %}

{% docs notifications__metadata %}
Metadata of the notification
{% enddocs %}
