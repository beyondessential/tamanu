{% docs logs__table__fhir_writes %}
Full-request logs of writes (creates and modifies) coming over the FHIR API.

FHIR is an extensive standard and we current support a small subset of it. There's an even tinier
subset of that which supports writes instead of just reads and searches. To avoid missing or losing
data which we could support accepting as writes in the future, and for development purposes, this
table logs the full request bodies for FHIR endpoints. This is not just the endpoints that we
currently support, but all incoming write requests.
{% enddocs %}

{% docs logs__fhir_writes__id %}
UUID
{% enddocs %}

{% docs logs__fhir_writes__created_at %}
When Tamanu received the request.
{% enddocs %}

{% docs logs__fhir_writes__verb %}
HTTP verb (GET, POST, etc)
{% enddocs %}

{% docs logs__fhir_writes__url %}
HTTP URL
{% enddocs %}

{% docs logs__fhir_writes__body %}
Full request body
{% enddocs %}

{% docs logs__fhir_writes__headers %}
Selected request headers.

Some headers are stripped for sensitivity.
{% enddocs %}

{% docs logs__fhir_writes__user_id %}
The authenticated user for the API request.
{% enddocs %}
