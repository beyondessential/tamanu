{% docs table__devices %}
Devices that are authorised to login.

Devices not in the table can only connect if the user they're
**first** logging in as has the appropriate permission (`device_registration_permission`
on the [`users`](#!/source/source.tamanu.tamanu.users) table). The permission can be:
- `none`: User cannot register any new devices
- `single`: User can register one device
- `unlimited`: User can register unlimited devices

This check is not performed when `features.deviceRegistration` is disabled.
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
