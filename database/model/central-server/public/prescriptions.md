{% docs table__prescriptions %}
Records prescriptions for medications.
{% enddocs %}

{% docs prescriptions__end_date %}
When the prescription ends.
{% enddocs %}

{% docs prescriptions__indication %}
The [indication of use](https://en.wikipedia.org/wiki/Indication_(medicine)) for the medicine.
{% enddocs %}

{% docs prescriptions__route %}
Administration route for the medication.
{% enddocs %}

{% docs prescriptions__medication_id %}
The medication ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = drug`).
{% enddocs %}

{% docs prescriptions__prescriber_id %}
[Who](#!/source/source.tamanu.tamanu.users) prescribed the medication.
{% enddocs %}

{% docs prescriptions__notes %}
Free-form note about the prescription.
{% enddocs %}

{% docs prescriptions__quantity %}
Quantity of medicine to dispense.
{% enddocs %}

{% docs prescriptions__discontinued %}
Whether the prescription was discontinued.
{% enddocs %}

{% docs prescriptions__discontinuing_clinician_id %}
If the prescription was discontinued, who did it.
{% enddocs %}

{% docs prescriptions__discontinuing_reason %}
If the prescription was discontinued, why that happened.
{% enddocs %}

{% docs prescriptions__repeats %}
How many times this prescription can be repeatedly dispensed without a new prescription.
{% enddocs %}

{% docs prescriptions__discontinued_date %}
If the prescription was discontinued, when that happened.
{% enddocs %}

{% docs prescriptions__end_date_legacy %}
[Deprecated] When the prescription ends.
{% enddocs %}

{% docs prescriptions__is_ongoing %}
A flag to determine whether or not the current prescription is ongoing
{% enddocs %}

{% docs prescriptions__is_prn %}
A flag to determine whether or not the current prescription is prn
{% enddocs %}

{% docs prescriptions__is_variable_dose %}
A flag to determine whether or not the current prescription is variable does
{% enddocs %}

{% docs prescriptions__dose_amount %}
Numeric field to record dose amount
{% enddocs %}

{% docs prescriptions__units %}
The units of the prescription
{% enddocs %}

{% docs prescriptions__frequency %}
The frequency of the prescription
{% enddocs %}

{% docs prescriptions__start_date %}
The start date of the prescription
{% enddocs %}

{% docs prescriptions__duration_value %}
The duration value of the prescription
{% enddocs %}

{% docs prescriptions__duration_unit %}
The duration unit of the prescription
{% enddocs %}

{% docs prescriptions__is_phone_order %}
A flag to determine whether or not the current prescription is phone order
{% enddocs %}

{% docs prescriptions__ideal_times %}
Ideal times which are specified by prescriber
{% enddocs %}

{% docs prescriptions__pharmacy_notes %}
Free-form pharmacy note of the prescription.
{% enddocs %}

{% docs prescriptions__display_pharmacy_notes_in_mar %}
A flag to determine whether to display 'Pharmacy notes' on the medication administration record
{% enddocs %}
