{% docs table__encounter_medications %}
Records prescriptions for medications.
{% enddocs %}

{% docs prescriptions__end_date %}
When the prescription ends.
{% enddocs %}

{% docs prescriptions__note %}
Free-form note about the prescription.
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
