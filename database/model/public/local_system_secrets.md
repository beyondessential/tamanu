{% docs table__local_system_secrets %}
Sensitive values proper to this installation of Tamanu, such as the device key
and the reporting-role secret.

These are kept separate from `local_system_facts` so the read-only reporting
roles can be denied access to them. They are never synchronised, never exported,
and usage is entirely internal to Tamanu.
{% enddocs %}

{% docs local_system_secrets__key %}
Key of the secret.
{% enddocs %}

{% docs local_system_secrets__value %}
Value of the secret.

This is `text`, but may be interpreted as other things, e.g. a PEM-encoded key.
Always masked, as it holds credentials.
{% enddocs %}
