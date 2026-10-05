{% docs table__pharmacy_order_prescriptions %}
Individual prescriptions that are included in a [pharmacy_order](#!/source/source.tamanu.tamanu.pharmacy_orders).
{% enddocs %}

{% docs pharmacy_order_prescriptions__pharmacy_order_id %}
Reference to the [pharmacy_order](#!/source/source.tamanu.tamanu.pharmacy_orders).
{% enddocs %}

{% docs pharmacy_order_prescriptions__prescription_id %}
Reference to the [prescription](#!/source/source.tamanu.tamanu.prescriptions).
{% enddocs %}

{% docs pharmacy_order_prescriptions__ongoing_prescription_id %}
When this pharmacy order prescription was created from an ongoing prescription (send to pharmacy flow), references the ongoing [prescription](#!/source/source.tamanu.tamanu.prescriptions). Null for encounter-based pharmacy orders.
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

{% docs pharmacy_order_prescriptions__not_dispensed_reason_id %}
Reference to a [reference_data](#!/source/source.tamanu.tamanu.reference_data) row of type `medicationNotDispensedReason` — the reason this request was recorded as not dispensed instead of being dispensed. Null unless the request was recorded as not dispensed.
{% enddocs %}

{% docs pharmacy_order_prescriptions__not_dispensed_by_id %}
Reference to the [user](#!/model/model.public.users) who recorded this request as not dispensed. Null unless the request was recorded as not dispensed.
{% enddocs %}

{% docs pharmacy_order_prescriptions__not_dispensed_at %}
When this request was recorded as not dispensed. A non-null value marks the request as not dispensed rather than deleted or dispensed; the request is soft deleted at the same time. Null unless the request was recorded as not dispensed.
{% enddocs %}
