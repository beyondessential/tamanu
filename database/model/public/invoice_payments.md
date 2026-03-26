{% docs table__invoice_payments %}
Individual payment against an invoice.

Invoices can be paid in installments, by different parties, etc.
{% enddocs %}

{% docs invoice_payments__invoice_id %}
The [invoice](#!/source/source.tamanu.tamanu.invoices).
{% enddocs %}

{% docs invoice_payments__receipt_number %}
Receipt number. Usually auto-generated.
{% enddocs %}

{% docs invoice_payments__amount %}
Amount paid.
{% enddocs %}

{% docs invoice_payments__updated_by_user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who updated this invoice payment.
{% enddocs %}

{% docs invoice_payments__original_payment_id %}
Foreign key to the payment that this refund is reversing (null for non-refund transactions)
{% enddocs %}
