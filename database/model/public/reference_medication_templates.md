{% docs table__reference_medication_templates %}
Stores templates for medications, allowing for pre-defined medication orders.
{% enddocs %}

{% docs reference_medication_templates__reference_data_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data) for this medication template.
{% enddocs %}

{% docs reference_medication_templates__medication_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data) for the specific drug in this template.
{% enddocs %}

{% docs reference_medication_templates__is_variable_dose %}
Boolean indicating if the medication is to be administered "pro re nata" (as needed).
{% enddocs %}

{% docs reference_medication_templates__is_prn %}
Boolean indicating if the medication dose is variable.
{% enddocs %}

{% docs reference_medication_templates__dose_amount %}
The amount of medication per dose.
{% enddocs %}

{% docs reference_medication_templates__units %}
The unit for the dose amount (e.g., mg, mL).
{% enddocs %}

{% docs reference_medication_templates__frequency %}
How often the medication should be administered (e.g., BID, TID, QID).
{% enddocs %}

{% docs reference_medication_templates__route %}
The route of administration for the medication (e.g., Oral, IV, IM).
{% enddocs %}

{% docs reference_medication_templates__duration_value %}
The numeric value for the duration the medication should be taken (e.g., 7, 14).
{% enddocs %}

{% docs reference_medication_templates__duration_unit %}
The unit for the medication duration (e.g., days, weeks, months).
{% enddocs %}

{% docs reference_medication_templates__notes %}
Additional notes or instructions for the medication template.
{% enddocs %}

{% docs reference_medication_templates__discharge_quantity %}
The quantity of medication to be dispensed upon patient discharge.
{% enddocs %}

{% docs reference_medication_templates__is_ongoing %}
A boolean indicating if the medication is ongoing
{% enddocs %}
