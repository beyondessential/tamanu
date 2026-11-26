{% docs table__reference_drugs %}
Additional information about referenceData that is of the type “drug”
{% enddocs %}

{% docs reference_drugs__reference_data_id %}
Id of the associated reference data
{% enddocs %}

{% docs reference_drugs__route %}
Route of the drug
{% enddocs %}

{% docs reference_drugs__notes %}
Notes of the drug
{% enddocs %}

{% docs reference_drugs__is_sensitive %}
Whether the drug is sensitive and requires special handling
{% enddocs %}

{% docs reference_drugs__dosing_unit %}
The dosing units of the drug
{% enddocs %}

{% docs reference_drugs__dispensing_unit %}
The dispensing units of the drug
{% enddocs %}

{% docs reference_drugs__unit_conversion %}
Number of dosing unit to equal 1 unit of the dispensing unit
{% enddocs %}

{% docs reference_drugs__dose_min %}
Lowest expected dose amount, in the drug's dosing unit. A prescribed dose below it shows a warning but can still be saved. Null when the drug has no minimum dose
{% enddocs %}

{% docs reference_drugs__dose_max %}
Highest expected dose amount, in the drug's dosing unit. A prescribed dose above it shows a warning but can still be saved. Null when the drug has no maximum dose
{% enddocs %}

{% docs reference_drugs__dispensing_quantity_min %}
Lowest expected dispensing quantity, in the drug's dispensing unit. A quantity below it shows a warning but can still be saved. Null when the drug has no minimum quantity
{% enddocs %}

{% docs reference_drugs__dispensing_quantity_max %}
Highest expected dispensing quantity, in the drug's dispensing unit. A quantity above it shows a warning but can still be saved. Null when the drug has no maximum quantity
{% enddocs %}
