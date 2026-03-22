{% docs table__reference_data %}
User imported reference data for the environment grouped by type.

- Catch-all for simple reference data types - there are a LOT of kinds of reference data that exist as just an ID, a 
string label, and occasionally a code; these are all grouped into this table to avoid overcomplicating the schema.
- Occasionally a type of simple reference data will gain some complexity, at which point it will be refactored/migrated 
out to use its own table.
- Simple reference data types include a code, type, name and visibility status.
- Example types include `diagnosis`, `procedures`
{% enddocs %}

{% docs reference_data__code %}
Code of the data item (short value, alphanumerics and hyphens).
{% enddocs %}

{% docs reference_data__type %}
Class of the data (referred to in code).

Whenever this table is referred to in a relationship, it's to a specific `type` here. For example a
table might have a `diagnosis_id`, which is a reference to this table, for specifically only the
rows with `type = diagnosis`.
{% enddocs %}

{% docs reference_data__name %}
Actual data
{% enddocs %}

{% docs reference_data__system_required %}
Indicates if this record is system-managed and cannot be modified by users
{% enddocs %}
