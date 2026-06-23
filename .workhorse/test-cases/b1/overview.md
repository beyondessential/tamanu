# Fixed-price medications — test cases

Scenarios that verify the fixed-price medication behaviour on price lists, invoices, and the spreadsheet importer.

## Pricing maths

- [x] Fixed-price line charges the configured fee once, regardless of quantity (verifies spec: FXM) — `packages/utils/__test__/invoice.test.ts`
- [x] Per-unit pricing remains the default when `isFixedPrice` is false (verifies spec: FXM) — `packages/utils/__test__/invoice.test.ts`
- [x] Finalised `isFixedPriceFinal` snapshot takes precedence over the live price list flag (verifies spec: FXM) — `packages/utils/__test__/invoice.test.ts`
- [x] Percentage discounts apply proportionally to the fixed fee (verifies spec: FXM) — `packages/utils/__test__/invoice.test.ts`
- [x] Insurance coverage applies proportionally to the fixed fee (verifies spec: FXM) — `packages/utils/__test__/invoice.test.ts`
- [x] Whole-invoice summary reflects the fixed fee for totals, coverage, and patient balance (verifies spec: FXM) — `packages/utils/__test__/invoice.test.ts`

## Finalise snapshot

- [x] Finalising an invoice with a fixed-price medication snapshots `isFixedPriceFinal` true (verifies spec: FXM) — `packages/facility-server/__tests__/apiv1/Invoice.test.js`
- [x] Finalising an invoice with a per-unit medication snapshots `isFixedPriceFinal` false (verifies spec: FXM) — `packages/facility-server/__tests__/apiv1/Invoice.test.js`

## Price-list lookup API

- [x] `GET /invoices/price-list-item` returns `isFixedPrice: false` for a per-unit row (verifies spec: FXM) — `packages/facility-server/__tests__/apiv1/Invoice.test.js`
- [x] `GET /invoices/price-list-item` returns `isFixedPrice: true` for a fixed-price row (verifies spec: FXM) — `packages/facility-server/__tests__/apiv1/Invoice.test.js`

## Spreadsheet import

- [x] `fixed PL_FIXED` header token marks the column as fixed-by-default and is stripped from the resolved code (verifies spec: FXM) — `packages/central-server/__tests__/importers/invoicePriceListLoader.test.js`
- [x] Header `fixed` token is case-insensitive (verifies spec: FXM) — `packages/central-server/__tests__/importers/invoicePriceListLoader.test.js`
- [x] Per-cell `f` / `F` prefix overrides per-unit columns to fixed (verifies spec: FXM) — `packages/central-server/__tests__/importers/invoicePriceListLoader.test.js`
- [x] Surrounding whitespace and case variation on the `f` prefix are tolerated (verifies spec: FXM) — `packages/central-server/__tests__/importers/invoicePriceListLoader.test.js`
- [x] A cell with a malformed marker (e.g. `fabc`) is rejected as invalid (verifies spec: FXM) — `packages/central-server/__tests__/importers/invoicePriceListLoader.test.js`

## Database invariants

- [x] DB rejects rows with both `is_hidden` and `is_fixed_price` set true (verifies spec: FXM) — enforced by the `invoice_price_list_items_hidden_fixed_exclusive` check constraint

## Manual verification

- [ ] Importing a real Kosrae-style price list spreadsheet with a `fixed` column header round-trips through export
- [ ] In-progress invoice line displays the configured quantity but charges only the fixed fee
- [ ] Discount and insurance edits on a fixed-price line update totals correctly without quantity influence
