{% docs fhir__table__organizations %}
FHIR data about organizations.

These are materialised from `public.facilities`.

This is mostly a stub resource that other, more clinically relevant, resources reference.

<https://www.hl7.org/fhir/organization.html>
{% enddocs %}

{% docs fhir__organizations__identifier %}
The facility's code.
{% enddocs %}

{% docs fhir__organizations__name %}
The facility's name.
{% enddocs %}

{% docs fhir__organizations__active %}
Whether the facility is active.

This is materialised from `visibility_status`.
{% enddocs %}
