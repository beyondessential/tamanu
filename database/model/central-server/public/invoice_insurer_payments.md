{% docs table__invoice_insurer_payments %}
Extra metadata about a payment when it was done by a patient.
{% enddocs %}

{% docs invoice_insurer_payments__invoice_payment_id %}
The [payment](#!/source/source.tamanu.tamanu.invoice_payments).
{% enddocs %}

{% docs invoice_insurer_payments__insurer_id %}
The insurer ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)).
{% enddocs %}

{% docs invoice_insurer_payments__status %}
The status of this payment.

One of:
- `unpaid`
- `paid`
- `partial`
- `rejected`
{% enddocs %}

{% docs invoice_insurer_payments__reason %}
The reason for the payment. Generally this is used for rejections.
{% enddocs %}
