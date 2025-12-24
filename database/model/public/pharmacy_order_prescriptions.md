{% docs table__pharmacy_order_prescriptions %}
Individual prescriptions that are included in a [pharmacy_order](#!/source/source.tamanu.tamanu.pharmacy_orders).
{% enddocs %}

{% docs pharmacy_order_prescriptions__pharmacy_order_id %}
Reference to the [pharmacy_order](#!/source/source.tamanu.tamanu.pharmacy_orders).
{% enddocs %}

{% docs pharmacy_order_prescriptions__prescription_id %}
Reference to the [prescription](#!/source/source.tamanu.tamanu.prescriptions).
{% enddocs %}

{% docs pharmacy_order_prescriptions__display_id %}
Human-readable request number for this prescription order. A new request number is generated each time a prescription is sent to pharmacy.
{% enddocs %}

{% docs pharmacy_order_prescriptions__quantity %}
Quantity of medication ordered.
{% enddocs %}

{% docs pharmacy_order_prescriptions__repeats %}
Number of repeats for the prescription.
{% enddocs %}
