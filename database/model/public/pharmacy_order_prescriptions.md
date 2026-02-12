{% docs table__pharmacy_order_prescriptions %}
Individual prescriptions that are included in a [pharmacy_order](#!/source/source.tamanu.tamanu.pharmacy_orders).
{% enddocs %}

{% docs pharmacy_order_prescriptions__pharmacy_order_id %}
Reference to the [pharmacy_order](#!/source/source.tamanu.tamanu.pharmacy_orders).
{% enddocs %}

{% docs pharmacy_order_prescriptions__prescription_id %}
Reference to the [prescription](#!/source/source.tamanu.tamanu.prescriptions).
{% enddocs %}

{% docs pharmacy_order_prescriptions__source_prescription_id %}
When this pharmacy order prescription was created from an ongoing prescription (send to pharmacy flow), references the source [prescription](#!/source/source.tamanu.tamanu.prescriptions). Null for encounter-based pharmacy orders.
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

{% docs pharmacy_order_prescriptions__is_completed %}
Indicates whether this prescription has been fully completed. Set to `true` when all repeats have been dispensed for a discharge prescription (outpatient medication). Used to filter completed prescriptions from active medication request lists.
{% enddocs %}
