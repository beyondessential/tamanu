{% docs table__portal_one_time_tokens %}
A table that stores one-time tokens for portal users. These tokens are used for secure operations such as login, password reset, and other temporary authentication requirements. Each token is associated with a specific portal user and has an expiration date.
{% enddocs %}

{% docs portal_one_time_tokens__portal_user_id %}
Foreign key that references the id of the portal user to whom this token belongs. When the user is deleted, all associated tokens are automatically deleted (CASCADE).
{% enddocs %}

{% docs portal_one_time_tokens__type %}
Specifies the purpose of the token
One of:
- `login` (default)
- `password-reset`
{% enddocs %}

{% docs portal_one_time_tokens__token %}
The unique, secure token string that is used for verification. This token should be generated with strong cryptographic methods to ensure security.
{% enddocs %}

{% docs portal_one_time_tokens__expires_at %}
The timestamp at which this token expires and becomes invalid. Tokens should have a limited lifespan appropriate to their purpose, typically ranging from a few minutes to 24 hours depending on the token type.
{% enddocs %}
