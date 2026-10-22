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

{% docs devices__central_endpoint %}
The central endpoint (scheme, host and optional port) a facility server or
mobile device last reported using, when it started a sync session.

It is reported by the device rather than observed by central, because a reverse
proxy can rewrite or hide the name a request arrived on. Null for devices that
have never reported, such as those running a version from before reporting.
{% enddocs %}

{% docs devices__central_endpoint_reported_at %}
When the device last reported its central endpoint.
{% enddocs %}
