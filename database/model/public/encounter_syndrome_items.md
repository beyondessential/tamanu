{% docs table__encounter_syndrome_items %}
Records which syndromic surveillance symptoms were ticked for an encounter. A row is created the
first time a symptom is ticked, and its `checked` flag is then flipped as the practitioner revises
the record, rather than being deleted.
{% enddocs %}

{% docs encounter_syndrome_items__encounter_syndrome_id %}
Reference to the [encounter syndrome](#!/source/source.tamanu.tamanu.encounter_syndromes) record
this item belongs to.
{% enddocs %}

{% docs encounter_syndrome_items__syndrome_id %}
The syndromic surveillance symptom ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs encounter_syndrome_items__checked %}
A boolean indicating whether this symptom is currently ticked for the encounter.
{% enddocs %}
