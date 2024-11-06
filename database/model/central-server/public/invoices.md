{% docs table__invoices %}
Invoices related to encounters.
{% enddocs %}

{% docs invoices__display_id %}
Short unique identifier used on the frontend.
{% enddocs %}

{% docs invoices__status %}
Status of the invoice.

One of:
- `cancelled`
- `in_progress`
- `finalised`
{% enddocs %}

{% docs invoices__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this invoice is a part of.
{% enddocs %}

{% docs invoices__patient_payment_status %}
Payment status (patient portion, if applicable).

One of:
- `unpaid`
- `paid`
- `partial`
{% enddocs %}

{% docs invoices__insurer_payment_status %}
Payment status (insurer portion, if applicable).

One of:
- `unpaid`
- `paid`
- `partial`
- `rejected`
{% enddocs %}
