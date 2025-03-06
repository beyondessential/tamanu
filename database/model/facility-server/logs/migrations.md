{% docs logs__table__migrations %}
Contains a full log of all migrations made.
{% enddocs %}

{% docs logs__migrations__id %}
The ID of the change log row. This is auto-generated from random.
{% enddocs %}

{% docs logs__migrations__logged_at %}
The timestamp this change was logged.
{% enddocs %}

{% docs logs__migrations__current_sync_tick %}
The current sync tick at time of migrations
{% enddocs %}

{% docs logs__migrations__direction %}
The direction of the migration i.e applied (`up`) or reverted (`down`)
{% enddocs %}

{% docs logs__migrations__migrations %}
Comma seperated list of the applied/reverted migrations
{% enddocs %}
