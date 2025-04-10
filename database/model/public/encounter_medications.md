{% docs table__encounter_medications %}
Records prescriptions for medications in the context of an encounter.
{% enddocs %}

{% docs encounter_medications__end_date %}
When the prescription ends.
{% enddocs %}

{% docs encounter_medications__prescription %}
The instructions for the prescription.
{% enddocs %}

{% docs encounter_medications__note %}
Free-form note about the prescription.
{% enddocs %}

{% docs encounter_medications__indication %}
The [indication of use](https://en.wikipedia.org/wiki/Indication_(medicine)) for the medicine.
{% enddocs %}

{% docs encounter_medications__route %}
Administration route for the medication.
{% enddocs %}

{% docs encounter_medications__qty_morning %}
How much should be taken in the morning.
{% enddocs %}

{% docs encounter_medications__qty_lunch %}
How much should be taken at lunch.
{% enddocs %}

{% docs encounter_medications__qty_evening %}
How much should be taken in the evening.
{% enddocs %}

{% docs encounter_medications__qty_night %}
How much should be taken at night.
{% enddocs %}

{% docs encounter_medications__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this prescription is for.
{% enddocs %}

{% docs encounter_medications__medication_id %}
The medication ([Reference Data](#!/source/source.tamanu.tamanu.reference_data), `type = drug`).
{% enddocs %}

{% docs encounter_medications__prescriber_id %}
[Who](#!/source/source.tamanu.tamanu.users) prescribed the medication.
{% enddocs %}

{% docs encounter_medications__quantity %}
Quantity of medicine to dispense.
{% enddocs %}

{% docs encounter_medications__discontinued %}
Whether the prescription was discontinued.
{% enddocs %}

{% docs encounter_medications__discontinuing_clinician_id %}
If the prescription was discontinued, who did it.
{% enddocs %}

{% docs encounter_medications__discontinuing_reason %}
If the prescription was discontinued, why that happened.
{% enddocs %}

{% docs encounter_medications__repeats %}
How many times this prescription can be repeatedly dispensed without a new prescription.
{% enddocs %}

{% docs encounter_medications__is_discharge %}
Whether the prescription is for when the patient is discharged.
{% enddocs %}

{% docs encounter_medications__discontinued_date %}
If the prescription was discontinued, when that happened.
{% enddocs %}

{% docs encounter_medications__end_date_legacy %}
[Deprecated] When the prescription ends.
{% enddocs %}
