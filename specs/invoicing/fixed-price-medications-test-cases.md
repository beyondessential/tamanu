# Fixed-price medications — test cases

Verifies `docs/specs/invoicing/fixed-price-medications.md` (TAM-6897).

Layers: **calc** unit tests (`packages/utils/__test__/invoice.test.ts`, vitest), **import/export** integration tests (`packages/central-server/__tests__/importers/`, real XLSX + DB), and **manual UI/printout** checks. Each scenario cites the criterion it verifies; uncited ones are operational.

## Pricing calc (unit)

- [ ] A fixed-price medication line (category `Drug`, `invoicePriceListItem.isFixedPrice = true`, price $2.00) with quantity 30 returns a line total of $2.00, not $60.00. *(Pricing: charged once regardless of quantity)*
- [ ] The same line with quantity 1 also returns $2.00 — the total is identical across quantities. *(Pricing: quantity is informational only)*
- [ ] A medication line with `isFixedPrice = false` and price $2.00 × quantity 30 still returns $60.00 — per-unit remains the default. *(Pricing: per-unit is default)*
- [ ] A non-medication product (e.g. category `Lab`) with `isFixedPrice = true` and quantity 30 is still charged price × quantity — the flag is ignored for non-medications. *(Scope: flag honoured only for medications)*
- [ ] A medication line with `isFixedPrice = true` but no `invoicePriceListItem` price falls through to 0 (no quantity multiplication artefacts). *(Pricing)*

## Discounts & insurance (unit)

- [ ] A 10% percentage discount on a $2.00 fixed line discounts to $1.80 (discount applies to the fee, not fee × quantity). *(Discounts: apply to the fixed fee)*
- [ ] A fixed-amount discount on a fixed line subtracts from the flat fee, not from fee × quantity. *(Discounts)*
- [ ] 80% insurance coverage on a $2.00 fixed line covers $1.60 and leaves the patient owing $0.40, regardless of quantity. *(Insurance: proportional to the fixed fee)*
- [ ] Discount + insurance combined on a fixed line: coverage is computed off the discounted fixed fee (e.g. 10% discount then 80% coverage on $2.00 → discounted $1.80, covered $1.44, patient $0.36). *(Insurance: off discounted fee)*
- [ ] `getInvoiceItemNetCost` for a fixed line equals discounted fee minus coverage with no quantity term. *(Insurance: net cost from flat fee)*
- [ ] Insurance coverage on a fixed line is capped at the discounted fixed fee (never exceeds it). *(Insurance: coverage caps)*

## Invoice totals (unit / integration)

- [ ] An invoice summary including a fixed-price line sums the flat fee into the invoice total — quantity does not leak into the grand total, discount total, or insurer/patient totals. *(Insurance: totals computed from flat fee)*
- [ ] An invoice mixing a fixed-price medication line and a per-unit line totals each correctly and sums them. *(Pricing + per-unit default)*

## Manual edits (calc / UI)

- [ ] Overriding the price on a fixed line to $3.50 charges $3.50 (override × 1), not $3.50 × quantity. *(Manual edits: stays fixed)*
- [ ] A cashier can remove a fixed-price line like any other item, and a removed fixed line is not re-added by the medication recompute. *(Manual edits)*
- [ ] A manually-added ad-hoc item (no `invoicePriceListItem`) with a price and quantity charges price × quantity — ad-hoc items are never fixed. *(Manual edits: ad-hoc always per-unit)*

## Trigger (integration)

- [ ] A medication on a fixed-price price list with at least one unit dispensed/administered adds the line at the flat fee. *(Trigger: fee lands once a unit is dispensed)*
- [ ] A medication prescribed but with nothing dispensed/administered adds no fixed-price line. *(Trigger: no dispense → no fee)*
- [ ] Increasing the dispensed quantity on a fixed line (recompute) leaves the charged amount unchanged. *(Pricing: quantity informational only)*

## Import — charging tab (integration)

The **Invoice Price List Charging** tab: rows = `invoiceProductId`, columns = price-list codes, cells = `flatFee`/`perUnit`. Maps onto `InvoicePriceListItem.isFixedPrice`.

- [ ] A `flatFee` cell for a medication sets `isFixedPrice = true`; `perUnit` sets `false`. *(Charging: maps to isFixedPrice)*
- [ ] The charging tab **merges onto the existing price-list item** (same row): price from the price tab is preserved, `isFixedPrice` is set; no duplicate row is created. *(Charging: merges onto price item)*
- [ ] `flatFee`/`perUnit` matching is **case-insensitive** and trims whitespace (e.g. `FlatFee`). *(Charging: case-insensitive)*
- [ ] A **blank** cell is skipped (no error, nothing set) — a sparse sheet (value in one price-list column, blank in another) imports the filled cell only. *(Charging: blank = skip, round-trip safe)*
- [ ] An **unknown** value (e.g. `sometimes`) raises an import error. *(Validation: unknown value errors)*
- [ ] `flatFee` on a **non-medication** product raises an import error (fixed pricing is medications-only). *(Scope: flatFee on non-medication errors)*
- [ ] `perUnit` on a **non-medication** product imports without error (`isFixedPrice = false`). *(Scope: perUnit allowed on any product)*
- [ ] Re-importing the charging tab with a changed value flips `isFixedPrice` on the existing item (row reused). *(Charging: updates existing items)*
- [ ] The price tab (`invoicePriceListItem`) is unaffected — plain numbers and `hidden` import as before. *(Regression: price tab unchanged)*

## Export round-trip (integration)

- [ ] Exporting the charging tab includes **medications only** (non-medication products are excluded), emitting `flatFee` for fixed and `perUnit` otherwise. *(Export: medications only)*
- [ ] Export → re-import of the price and charging tabs reproduces identical `price` and `isFixedPrice` for every item. *(Export: lossless re-import)*

## Display / printout (manual)

- [ ] On the invoice form, a fixed-price medication line shows the dispensed quantity (e.g. 30), unit price $2.00, and line total $2.00. *(Display: quantity as-is, total = flat fee)*
- [ ] On the invoice PDF printout, the fixed line shows the same flat-fee total with no quantity multiplication. *(Display; `InvoiceRecordPrintout.jsx`)*
- [ ] No fixed-price badge, struck-through unit price, or hidden column appears — v1 has no distinct treatment. *(Scope: distinct UI out of scope)*

## Migration / regression

- [ ] The `isFixedPrice` column is added on `InvoicePriceListItem` (server only — invoicing has no mobile models); existing items default to `false`. *(Tech design: flag location)*
- [ ] Existing per-unit price lists are unaffected after the migration — totals, discounts, and insurance for non-fixed items are unchanged. *(Regression)*
