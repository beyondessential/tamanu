{% docs table__refresh_tokens %}
Refresh tokens are used by API clients to refresh their authentication quickly, within a timeout.
{% enddocs %}

{% docs refresh_tokens__refresh_id %}
Random value given to the client to use as this refresh token.
{% enddocs %}

{% docs refresh_tokens__device_id %}
Unique device ID from the client.
{% enddocs %}

{% docs refresh_tokens__user_id %}
The [user](#!/source/source.tamanu.tamanu.users) being authenticated as.
{% enddocs %}

{% docs refresh_tokens__expires_at %}
When the refresh token expires.
{% enddocs %}
