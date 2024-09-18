{% docs table__reference_data %}
User imported reference data for the environment grouped by type.
- Catch-all for simple reference data types - there are a LOT of kinds of reference data that exist as just an ID, a 
string label, and occasionally a code; these are all grouped into this table to avoid overcomplicating the schema.
- Occasionally a type of simple reference data will gain some complexity, at which point it will be refactored/migrated 
out to use its own table.
- Simple reference data types include a code, type, name and visibility status.
- Example types include `diagnosis`, `procedures`
{% enddocs %}

{% docs reference_data__catchment %}
Catchment type. `type = catchment`.
{% enddocs %}

{% docs reference_data__diagnosis %}
Diagnosis type. `type = diagnosis`.
{% enddocs %}

{% docs reference_data__diet %}
Diet type. `type = diet`.
{% enddocs %}

{% docs reference_data__discharge_disposition %}
Discharge disposition type. `type = dischargeDisposition`.
{% enddocs %}

{% docs reference_data__patient_billing_type %}
Patient billing type. `type = patientBillingType`.
{% enddocs %}

{% docs reference_data__vaccine_not_given_reason %}
Reason for administered vaccine's 'NOT_GIVEN' status. `type = vaccineNotGivenReason`.
{% enddocs %}

{% docs reference_data__vaccine_circumstance %}
Circumstances for administered vaccine's 'NOT_GIVEN' status. `type = vaccineCircumstance`.
{% enddocs %}
