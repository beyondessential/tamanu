{% docs table__devices %}
Devices that are authorised to login.

Devices not in the table can only connect if the user they're
**first** logging in as has enough quota (`device_registration_quota`
on the [`users`](#!/source/source.tamanu.tamanu.users) table.)

This check is not performed when `features.deviceRegistrationQuota` is disabled.
{% enddocs %}

{% docs devices__last_seen_at %}
When this device last logged in.
{% enddocs %}

{% docs devices__registered_by_id %}
Which user registered this device.

This is used for quota calculations.
{% enddocs %}

{% docs devices__name %}
Optional descriptive name, to make it easier to map device IDs to real devices
in debugging and troubleshooting situations.
{% enddocs %}

{% docs devices__scopes %}
Scopes the device is authorised to access.

Scopes allow access to parts of the API that are closed to other devices
otherwise. Some scopes are restricted by quota. Devices aren't allowed to
request more scopes than they currently have, but may login without
specifying the full scopes they have.
{% enddocs %}

{% docs devices__last_successful_sync_push %}
The client-local sync tick up to which this device's pushed changes have been
durably persisted on central. Central is the authority on how far a client has
pushed; the client resumes its push from the lower of this and its own cursor.
Null until the device's first push is persisted.
{% enddocs %}
