{% docs fhir__table__practitioners %}
FHIR data about practitioners.

These are materialised from `public.users`.

This is mostly a stub resource that other, more clinically relevant, resources reference.

<https://www.hl7.org/fhir/practitioner.html>
{% enddocs %}

{% docs fhir__practitioners__identifier %}
One or more identifiers:

- The Tamanu internal UUID for the user
- The Tamanu Display ID for the user, if present
{% enddocs %}

{% docs fhir__practitioners__name %}
The display name of the practitioner.
{% enddocs %}

{% docs fhir__practitioners__telecom %}
The practitioner's email.
{% enddocs %}
