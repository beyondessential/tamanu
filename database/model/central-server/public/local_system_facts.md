{% docs table__local_system_facts %}
A set of values that are proper to this installation of Tamanu.

These are never synchronised.
Usage is entirely internal to Tamanu and should never be used externally.
{% enddocs %}

{% docs local_system_facts__key %}
Key of the fact.
{% enddocs %}

{% docs local_system_facts__value %}
Value of the fact.

This is `text`, but may be interpreted as other things, e.g. JSON objects or numbers.
{% enddocs %}
