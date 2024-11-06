{% docs table__encounter_diets %}
A diet associated with an encounter.

A patient can be placed on a diet for various medical purposes.
Diets are specified in reference data.
{% enddocs %}

{% docs encounter_diets__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this diet is for.
{% enddocs %}

{% docs encounter_diets__diet_id %}
The diet ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = diet`).
{% enddocs %}
