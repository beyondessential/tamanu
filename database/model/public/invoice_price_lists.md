{% docs table__invoice_price_lists %}
Contains price list definitions used for invoice line item pricing. Each price list represents a set of pricing rules that can be applied to different types of invoices, patients, or services.
{% enddocs %}

{% docs invoice_price_lists__code %}
Unique identifier code for the price list. Used for referencing the price list in business logic and integrations.
{% enddocs %}

{% docs invoice_price_lists__name %}
Human-readable name of the price list, displayed in user interfaces and reports.
{% enddocs %}

{% docs invoice_price_lists__rules %}
JSON configuration containing the pricing rules and logic for this price list. Defines how prices are calculated or retrieved for invoice line items.
{% enddocs %}
