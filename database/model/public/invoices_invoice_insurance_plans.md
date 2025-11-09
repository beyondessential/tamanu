{% docs table__invoices_invoice_insurance_plans %}
Junction table linking invoices to insurance contracts. This many-to-many relationship allows an invoice to be associated with multiple insurance contracts.
{% enddocs %}

{% docs invoices_invoice_insurance_plans__invoice_id %}
Reference to the [invoice](#!/source/source.tamanu.tamanu.invoices) that this insurance contract applies to.
{% enddocs %}

{% docs invoices_invoice_insurance_plans__invoice_insurance_plan_id %}
Reference to the [insurance contract](#!/source/source.tamanu.tamanu.invoice_insurance_plans) being applied to the invoice.
{% enddocs %}
