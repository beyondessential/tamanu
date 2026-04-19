{% docs table__invoice_insurance_plan_payments %}
Extra metadata about a payment when it was done by an insurance plan.
{% enddocs %}

{% docs invoice_insurance_plan_payments__invoice_payment_id %}
The [payment](#!/source/source.tamanu.tamanu.invoice_payments).
{% enddocs %}

{% docs invoice_insurance_plan_payments__invoice_insurance_plan_id %}
The [insurance plan](#!/source/source.tamanu.tamanu.invoice_insurance_plans).
{% enddocs %}

{% docs invoice_insurance_plan_payments__status %}
The status of this payment.

One of:
- `unpaid`
- `paid`
- `partial`
- `rejected`
{% enddocs %}

{% docs invoice_insurance_plan_payments__reason %}
The reason for the payment. Generally this is used for rejections.
{% enddocs %}
