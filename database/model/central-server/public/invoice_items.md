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

{% docs invoice_items__product_name %}
Name of the product.

This is usually copied from the [product](#!/source/source.tamanu.tamanu.invoice_products); as
products can change names it is stored here for the record.
{% enddocs %}

{% docs invoice_items__product_price %}
Price of the product.

This is usually copied from the [product](#!/source/source.tamanu.tamanu.invoice_products); as
products can change price it is stored here for the record.
{% enddocs %}

{% docs invoice_items__ordered_by_user_id %}
[Who](#!/source/source.tamanu.tamanu.users) ordered the item.
{% enddocs %}

{% docs invoice_items__source_id %}
Items can be direct references to [procedures](#!/source/source.tamanu.tamanu.procedures),
[lab tests](#!/source/source.tamanu.tamanu.lab_tests), and
[imagings](#!/source/source.tamanu.tamanu.imaging_requests).

In those cases, this field is set to the id of the "source" row.

If this is set, the item is not editable.
{% enddocs %}

{% docs invoice_items__product_code %}
Code of the product.
{% enddocs %}

{% docs invoice_items__note %}
Free-form note for this item.
{% enddocs %}

{% docs invoice_items__product_discountable %}
Whether this product can be discounted.

This is usually copied from the [product](#!/source/source.tamanu.tamanu.invoice_products); as
products can change discountability it is stored here for the record.
{% enddocs %}
