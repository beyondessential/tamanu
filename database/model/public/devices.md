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

{% docs devices__registered_by_user_id %}
Which user registered this device.

This is used for quota calculations.
{% enddocs %}

{% docs devices__name %}
Optional descriptive name, to make it easier to map device IDs to real devices
in debugging and troubleshooting situations.
{% enddocs %}
