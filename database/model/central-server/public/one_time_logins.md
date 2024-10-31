{% docs table__one_time_logins %}
One time logins are used for password resets.
{% enddocs %}

{% docs one_time_logins__user_id %}
The [user](#!/source/source.tamanu.tamanu.users) for whom this one time login is for.
{% enddocs %}

{% docs one_time_logins__token %}
A random value to use as the login code.

This is sent to the user in an email and then entered in a form to reset their password.
{% enddocs %}

{% docs one_time_logins__expires_at %}
Beyond this time, the one time login can no longer be used.
{% enddocs %}

{% docs one_time_logins__used_at %}
When this token was used.
{% enddocs %}
