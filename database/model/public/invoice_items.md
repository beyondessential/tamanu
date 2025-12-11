{% docs table__invoice_items %}
Items (products) on invoices.
{% enddocs %}

{% docs invoice_items__invoice_id %}
The [invoice](#!/source/source.tamanu.tamanu.invoices).
{% enddocs %}

{% docs invoice_items__order_date %}
When the item was ordered.
{% enddocs %}

{% docs invoice_items__product_id %}
The [product](#!/source/source.tamanu.tamanu.invoice_products).
{% enddocs %}

{% docs invoice_items__quantity %}
Quantity ordered.
{% enddocs %}

{% docs invoice_items__ordered_by_user_id %}
[Who](#!/source/source.tamanu.tamanu.users) ordered the item.
{% enddocs %}

{% docs invoice_items__product_name_final %}
The final product name used on the invoice. Saved from the product name field when the invoice is finalised.
{% enddocs %}

{% docs invoice_items__manual_entry_price %}
Manually entered price override for this item, if specified. When set, this takes precedence over the product's standard price.
{% enddocs %}

{% docs invoice_items__note %}
Free-form note for this item.
{% enddocs %}

{% docs invoice_items__source_record_type %}
The underlying model that the source record belongs to.
{% enddocs %}

{% docs invoice_items__source_record_id %}
Foreign key relation for record type.
{% enddocs %}

{% docs invoice_items__product_code_final %}
The final product code used on the invoice. Saved from the product code field when the invoice is finalised.
{% enddocs %}

{% docs invoice_items__price_final %}
The final price per unit for this item on the invoice. This is determined by the manual_entry_price if provided, otherwise from the product's price when the invoice is finalised.
{% enddocs %}
