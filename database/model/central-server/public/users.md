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
How many devices the user can register.

Device registration is limited to prevent unauthorized access to the system. Devices in this
context are **sync** devices: these include the mobile app, but not the web app. Instead,
facility servers are sync devices, and support an unlimited number of non-device users.

A sync device essentially has at-least-read access to the entire database, and can write to
a large portion of it. So it's critical to restrict that access. However, this restriction
makes the onboarding experience for new mobile apps more cumbersome, and too-strict restrictions
could lead to much more severe anti-patterns like sharing unlimited or administrative accounts.

This field is a compromise between those two concerns. A user can register a device, and the
device itself then has sync access, even if the login user changes. This allows an admin to
set up large amounts of devices, then logout and let the device be used by a non-admin user.
It also allows admins to give a new user the ability to register their own device, once.

This quota is a fixed value, not decremented. The quota limit calculation is done at the time
of device registration, counting the amount of [sync devices](#!/source/source.tamanu.tamanu.sync_devices)
already registered by the authenticated user. Device sync records are kept on the central server
only, so there's no risk of eventual consistency throwing off the count.
{% enddocs %}
