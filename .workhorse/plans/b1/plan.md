# Fixed-price medications — implementation plan

# Tech notes

- Flag lives on `InvoicePriceListItem` as `is_fixed_price` boolean (default `false`), modelled on `is_hidden`.
- `is_hidden` and `is_fixed_price` are mutually exclusive — enforce in import + a check constraint.
- Price calc lives in `packages/utils/src/invoice/invoiceItem.ts`. Add `isInvoiceItemFixedPrice(item)` helper and special-case `getInvoiceItemTotalPrice` there so every total/coverage/net-cost computed downstream is correct.
- Fixed-price detection needs to flow from the price-list item to the invoice item:
  - During in-progress edits, `InvoiceItem` already includes `product.invoicePriceListItem` (see `InvoiceItem.getListReferenceAssociations`). Expose `isFixedPrice` on that include and through the `InvoiceItem` type.
  - Once finalised, the spec says fixed-price applies even after the price list item changes. Add `isFixedPriceFinal` mirror on `InvoiceItem` (like `priceFinal`) and snapshot it at finalisation.
- Import in `invoicePriceListItemLoaderFactory.js`:
  - Column-default mode set by a whitespace-separated `fixed` token on the header (case-insensitive). Token is stripped before the price list code is resolved.
  - Per-cell override with `f` (case-insensitive) prefix on a number, e.g. `f2.00`.
  - `f` and `hidden` are mutually exclusive on a single cell.
  - Locale-safe decimal parsing (trim whitespace).
- Exporter mirrors the convention: a fixed-price item exports as `f2.00` when the column isn't fixed-by-default, plain `2.00` when it is. Hidden still exports as `hidden`.
- API endpoint `GET /invoices/price-list-item` returns `isFixedPrice` alongside `price`.
- Frontend: only the math needs to change. Quantity display stays the same (per spec).
- dbt model needs the new column added.

## Checklist

- [x] Migration: add `is_fixed_price` column to `invoice_price_list_items` (+ exclusivity check constraint with `is_hidden`)
- [x] Migration: add `is_fixed_price_final` column to `invoice_items`
- [x] Constants: extend `INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES` with `FIXED_HEADER_TOKEN` / `FIXED_CELL_PREFIX`
- [x] Model: `InvoicePriceListItem.isFixedPrice`
- [x] Model: `InvoiceItem.isFixedPriceFinal` + include in finalise snapshot
- [x] Utils: extend `InvoiceItem` type, add `isInvoiceItemFixedPrice` helper, branch `getInvoiceItemTotalPrice`
- [x] Importer: column-default `fixed` header token + per-cell `f` prefix + hidden/fixed exclusivity
- [x] Exporter: produce `f`-prefixed cells, expose `isFixedPrice` from item; column-default token not applied (keeps it round-trippable)
- [x] Facility API: include `isFixedPrice` in `/invoices/price-list-item` response
- [x] Facility API: include `isFixedPrice` in price-list-item association attributes for invoice item listing
- [x] Facility API: snapshot `isFixedPriceFinal` in `/finalise`
- [x] dbt: regen + describe new columns
- [x] Tests: importer for header token + cell prefix + exclusivity
- [x] Tests: utils for `getInvoiceItemTotalPrice` fixed-price branch
- [x] Tests: integration test for `/invoices/price-list-item` returning `isFixedPrice`
