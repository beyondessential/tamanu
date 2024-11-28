{% docs table__program_registries %}
Table of program registries.

This provides functionality to track a patient population defined by a particular disease or
condition, and follow this population over time.

This table defines the different registries available to track users with.
{% enddocs %}

{% docs program_registries__code %}
Machine-friendly identifier.
{% enddocs %}

{% docs program_registries__name %}
Human-friendly name.
{% enddocs %}

{% docs program_registries__currently_at_type %}
Defines what kind of location the registry can be filtered with.

One of:
- `village`
- `facility`
{% enddocs %}

{% docs program_registries__program_id %}
Reference to a [program](#!/source/source.tamanu.tamanu.programs).
{% enddocs %}
