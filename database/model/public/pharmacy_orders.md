{% docs table__pharmacy_orders %}
An order for prescriptions placed by Tamanu to a Pharmacy
{% enddocs %}

{% docs pharmacy_orders__ordering_clinician_id %}
Reference to the [clinician](#!/source/source.tamanu.tamanu.users) who placed the order.
{% enddocs %}

{% docs pharmacy_orders__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) for the order.
{% enddocs %}

{% docs pharmacy_orders__comments %}
Comments provided by the clinician when placing the order.
{% enddocs %}

{% docs pharmacy_orders__is_discharge_prescription %}
If the patient is being discharged with this prescription.
{% enddocs %}

{% docs pharmacy_orders__facility_id %}
Reference to the [facility](#!/source/source.tamanu.tamanu.facilities) where the pharmacy order was placed.
{% enddocs %}
