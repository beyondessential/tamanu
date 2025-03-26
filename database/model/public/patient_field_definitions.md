{% docs table__patient_field_definitions %}
Custom inputs to be included in the Tamanu patient details screens.

These are grouped using [categories](#!/source/source.tamanu.tamanu.patient_field_definition_categories).
{% enddocs %}

{% docs patient_field_definitions__name %}
Name of the input.
{% enddocs %}

{% docs patient_field_definitions__field_type %}
Input field type.

One of:
- `string`
- `number`
- `select`
{% enddocs %}

{% docs patient_field_definitions__options %}
When `type = 'select'`, the list of options for this select.

PostgreSQL array of strings.
{% enddocs %}

{% docs patient_field_definitions__category_id %}
The [category](#!/source/source.tamanu.tamanu.patient_field_definition_categories) this field is in.
{% enddocs %}
