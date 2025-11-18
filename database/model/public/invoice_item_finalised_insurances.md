{% docs table__invoice_item_finalised_insurances %}
Finalised insurance coverage values for invoice items.

This table stores the insurance coverage amounts that were locked in when an invoice item was created, 
preserving the coverage percentage at that point in time even if the insurance plan's coverage changes later.
{% enddocs %}

{% docs invoice_item_finalised_insurances__invoice_item_id %}
The [invoice item](#!/source/source.tamanu.tamanu.invoice_items) this insurance coverage applies to.
{% enddocs %}

{% docs invoice_item_finalised_insurances__coverage_value_final %}
The finalised coverage percentage for this invoice item.

This value is copied from the insurance plan's coverage at the time the invoice item was created,
preserving it for the record even if the insurance plan's coverage percentage changes later.
{% enddocs %}

{% docs invoice_item_finalised_insurances__invoice_insurance_plan_id %}
The [insurance plan](#!/source/source.tamanu.tamanu.invoice_insurance_plans) providing the coverage.
{% enddocs %}
