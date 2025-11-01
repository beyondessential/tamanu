{% docs table__invoice_price_list_items %}
Contains individual pricing entries for specific products within a price list. Each record defines the price or pricing configuration for a particular product in the context of a specific price list.
{% enddocs %}

{% docs invoice_price_list_items__invoice_price_list_id %}
Foreign key reference to the invoice_price_lists table. Links this pricing item to its parent price list.
{% enddocs %}

{% docs invoice_price_list_items__invoice_product_id %}
Foreign key reference to the invoice products/services that can be priced. Identifies which product or service this pricing item applies to.
{% enddocs %}

{% docs invoice_price_list_items__price %}
The price amount for this product in the context of this price list. Stored as a numeric value representing the cost in the system's base currency.
{% enddocs %}
