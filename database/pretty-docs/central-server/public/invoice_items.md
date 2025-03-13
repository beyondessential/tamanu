## invoice_items

Items (products) on invoices.

## invoice_id

The `invoice`.

## order_date

When the item was ordered.

## product_id

The `product`.

## quantity

Quantity ordered.

## product_name

Name of the product.

This is usually copied from the `product`; as
products can change names it is stored here for the record.

## product_price

Price of the product.

This is usually copied from the `product`; as
products can change price it is stored here for the record.

## ordered_by_user_id

`Who` ordered the item.

## source_id

Items can be direct references to `procedures`,
`lab tests`, and
`imagings`.

In those cases, this field is set to the id of the "source" row.

If this is set, the item is not editable.

## product_code

Code of the product.

## note

Free-form note for this item.

## product_discountable

Whether this product can be discounted.

This is usually copied from the `product`; as
products can change discountability it is stored here for the record.

