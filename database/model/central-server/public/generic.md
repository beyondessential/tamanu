{% docs generic__schema %}
Contains the primary data for Tamanu.

This is the main namespace for Tamanu data. All contained here is generally regarded as the source
of truth within Tamanu, with data in other schemas being ether auxiliary or derived from this in
some way.

Despite the name, this schema is not accessible publicly via postgres, and requires authentication.
{% enddocs %}

{% docs generic__id %}
Tamanu internal identifier (generally a UUID)
{% enddocs %}

{% docs generic__created_at %}
Timestamp of when record was created
{% enddocs %}

{% docs generic__updated_at %}
Timestamp of when record was last updated
{% enddocs %}

{% docs generic__deleted_at %}
Timestamp of when record was deleted
{% enddocs %}

{% docs generic__updated_by %}
The identifier of the user logged on when the record was created, updated or deleted 
{% enddocs %}

{% docs generic__date %}
Local date for the record
{% enddocs %}

{% docs generic__datetime %}
Local date and time for the record
{% enddocs %}

{% docs generic__start_datetime %}
Local start date and time for the record
{% enddocs %}

{% docs generic__end_datetime %}
Local end date and time for the record
{% enddocs %}

{% docs generic__date_legacy %}
[Deprecated] date field which is a timestamp of the event being recorded
{% enddocs %}

{% docs generic__date_recorded %}
Local date and time of the event being recorded
{% enddocs %}

{% docs generic__date_recorded_legacy %}
[Deprecated] date field which is a timestamp of the event being recorded
{% enddocs %}

{% docs generic__deletion_date %}
Date field which is a timestamp of record being deleted
{% enddocs %}

{% docs generic__visibility_status %}
The visibility status of the record.

- `current` indicates the record is currently in use and should be visible and accessible to users
  on the User Interface.
- `historical` indicates that the record is no longer in use and should not be visible nor
  accessible to users. However, the record may still be present in Reporting.
- `merged` indicates that the record has been merged, is no longer in use and should not be visible
  nor accessible to users.

The default value is `current`.
{% enddocs %}

{% docs generic__updated_at_sync_tick %}
Last tick that the record was updated. Used to figure out old vs new data when syncing
{% enddocs %}
