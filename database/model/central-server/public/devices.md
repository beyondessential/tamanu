{% docs table__devices %}
Device that can connect to this server.

This is a non-synced table.

In Tamanu, devices / facilities / users are orthogonal concepts:
- devices are unique instances of clients/servers (including mobile, but not including web clients)
  - also see `sync_device_ticks`, an implementation detail of the sync lookup cache
  - also see `sync_queued_devices`, an implementation detail of the sync queue
- facilities are logical locations that have associated settings and patient records for sync
  - devices that sync specify one or more facilities
  - devices can change which facilities they sync as
- users perform authentication and have roles and permissions
  - users may have multiple devices
  - users own devices (registered by)
  - users use devices (last login by)

The record contains a set of crude permissions flags that apply restrictions to
any particular device, named with the `can_` prefix. These columns do not have
defaults set at the database level; instead defaults are obtained from settings.
{% enddocs %}

{% docs devices__public_key %}
The ED25519 public key of the device, if known.

At login time, the auth request includes a device ID. However, there's no way to
trust that a given device really owns that ID simply based on the login request
HTTP-level application data. Any other agent could send arbitrary device IDs.

However, clients can provide a TLS certificate when connecting. When they do so,
the TLS handshake establishes authenticity (even without verifying the trust
chain of the certificate, which may be self-signed), and the server has access
to the public key of the certificate.

Checking that this public key matches the recorded one for a known device ID
ensures that devices can't be spoofed.

This field is null for legacy devices which don't provide a client certificate.
When this is the case, `can_sync` is ignored; only fully trusted devices are
able to use the sync endpoints.

As a transition, known devices without a recorded public key that present a
certificate will have their newly-presented public key recorded. This happens
once: after this is done, the normal process takes over (ie. the first request
from a legacy known device to present a certificate "wins").
{% enddocs %}

{% docs devices__metadata %}
Non-critical information about the device.

This includes a number of optional fields, mostly used for statistics, debug
diagnostics, etc. A particular schema should not be assumed, and may change
without migration of old data from version to version. It's also not uncommon
for a human operator to annotate devices via this column.

Known fields (non-exhaustive, no guarantees):
- `lastSyncTick`: sync tick at last complete session
- `remoteIp`: IP of the remote (client) for last connection
- `targetHost`: value of the `Host` header on the last login request
- `tlsVersion`
- `userAgent`
{% enddocs %}

{% docs devices__registered_by_id %}
The user that registered this device.

This is checked against a user's registration quota, to limit the amount of
devices that users can register. For most users this is either zero or one, such
that they can't register more devices without prior authorisation.

In mass mobile setup scenarios, an unprivileged user can be given a large quota
to do initial registration, after which devices will retain their identity even
when a different login user accesses the device in the future.
{% enddocs %}

{% docs devices__last_login_by_id %}
The user that last logged in specifying this device ID.

This may be different from `registered_by_id`.
{% enddocs %}

{% docs devices__can_login %}
Whether the device can obtain a session token via login.

This is used to implement a device approval queue: in the case where this
permission defaults to `false`, devices have to be manually approved via the
admin interface before they can do anything. Until then, when they login they'll
get rejected at the last step of the authentication process with a message to
consult their administrator.

The default for this option lives at `auth.deviceRegistration.defaults.canLogin`
in the [`settings`](#!/source/source.tamanu.tamanu.settings) table.
{% enddocs %}

{% docs devices__can_sync %}
Whether the device can use sync endpoints.

If `public_key` is null, this value is ignored and interpreted as `false`.

The default for this option lives at `auth.deviceRegistration.defaults.canSync`
in the [`settings`](#!/source/source.tamanu.tamanu.settings) table.
{% enddocs %}

{% docs devices__can_rebind %}
Whether the `last_login_by_id` can be updated.

If `can_rebind` is false, the last login field is essentially immutable: if a
known device logs in for a different user than recorded, it will be rejected on
the spot. If `can_rebind` is true, the login will be accepted (pending other
validations pass, like password/key and public key checks), and the
`last_login_by_id` value will be updated to the authentication user.

The default for this option lives at `auth.deviceRegistration.defaults.canRebind`
in the [`settings`](#!/source/source.tamanu.tamanu.settings) table.
{% enddocs %}
