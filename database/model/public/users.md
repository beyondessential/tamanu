{% docs table__users %}
Records of each user that can login to Tamanu.

This includes machine users.

There is one special user account with an all-zero `id`, which is the global "system" user. This is
used as a pseudo identity where the Tamanu system itself takes an action that normally is performed
by a human or API user.
{% enddocs %}

{% docs users__email %}
Email address for user. This is used to login and receive emails.
{% enddocs %}

{% docs users__password %}
Hashed password for user login.

The value is encoded as a "standard password hash" with a `$[type]$[params]$[salt]$[hash]` general
format. This allows upgrading algorithms and parameters seamlessly. The current algorithm is bcrypt.

This may be null to prevent a user from being able to login.
{% enddocs %}

{% docs users__display_name %}
The human readable display name for the user.
{% enddocs %}

{% docs users__display_id %}
Display identifier for the user.

This may be the employee code or badge number.
{% enddocs %}

{% docs users__phone_number %}
Phone number for the user.

This is not currently available anywhere visible.
{% enddocs %}

{% docs users__role %}
The role of the user, which sets their permission level.

The special values `admin` and `system` indicate a superadmin and a system user respectively.
{% enddocs %}

{% docs users__device_registration_quota %}
How many devices this user can register (when `features.deviceRegistrationQuota` is enabled).

See [`devices`](#!/source/source.tamanu.tamanu.devices) for more.
{% enddocs %}
