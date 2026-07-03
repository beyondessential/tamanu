# Fixed-price medications — test cases

Scenarios that verify fixed-price medications (spec: FIXED_PRICE_MEDICATIONS). They run across three layers: **calc** unit tests (`packages/utils/__test__/invoice.test.ts`), **import/export** integration tests (`packages/central-server/__tests__/importers/`, real XLSX + DB), and **manual UI/printout** checks. Scenarios cite the criterion they exercise; uncited ones are operational.

## Pricing calc

- [x] Charge a fixed-price medication line (price $2.00) with quantity 30 and confirm the line total is $2.00, not $60.00. verifies spec: FIXED_PRICE_MEDICATIONS#charging-behaviour
- [x] Charge the same fixed-price line with quantity 1 and confirm the total is still $2.00 — identical across quantities. verifies spec: FIXED_PRICE_MEDICATIONS#charging-behaviour
- [x] Charge a per-unit medication line (price $2.00, quantity 30) and confirm the total is $60.00 — per-unit is the default. verifies spec: FIXED_PRICE_MEDICATIONS#charging-behaviour
- [x] Charge a non-medication product marked fixed price with quantity 30 and confirm it is still charged price × quantity — fixed pricing is ignored for non-medications. verifies spec: FIXED_PRICE_MEDICATIONS#charging-behaviour
- [x] Charge a fixed-price medication line that has no price and confirm it falls through to 0 with no quantity-multiplication artefacts. verifies spec: FIXED_PRICE_MEDICATIONS#charging-behaviour

## Discounts and insurance

- [x] Apply a 10% discount to a $2.00 fixed-price line and confirm it discounts to $1.80 (discount off the fee, not fee × quantity). verifies spec: FIXED_PRICE_MEDICATIONS#discounts-and-insurance
- [x] Apply a fixed-amount discount to a fixed-price line and confirm it subtracts from the flat fee, not from fee × quantity. verifies spec: FIXED_PRICE_MEDICATIONS#discounts-and-insurance
- [x] Apply 80% insurance coverage to a $2.00 fixed-price line and confirm coverage is $1.60 and the patient owes $0.40, regardless of quantity. verifies spec: FIXED_PRICE_MEDICATIONS#discounts-and-insurance
- [x] Apply a 10% discount then 80% coverage to a $2.00 fixed-price line and confirm discounted $1.80, covered $1.44, patient $0.36 — coverage is off the discounted fee. verifies spec: FIXED_PRICE_MEDICATIONS#discounts-and-insurance
- [x] Compute net cost for a fixed-price line and confirm it equals the discounted fee minus coverage, with no quantity term. verifies spec: FIXED_PRICE_MEDICATIONS#discounts-and-insurance
- [x] Confirm insurance coverage on a fixed-price line is capped at the discounted flat fee and never exceeds it. verifies spec: FIXED_PRICE_MEDICATIONS#discounts-and-insurance

## Invoice totals

- [x] Summarise an invoice containing a fixed-price line and confirm the flat fee flows into the grand total, discount total, and insurer/patient totals with no quantity leak. verifies spec: FIXED_PRICE_MEDICATIONS#discounts-and-insurance
- [x] Summarise an invoice mixing a fixed-price medication line and a per-unit line and confirm each totals correctly and they sum. verifies spec: FIXED_PRICE_MEDICATIONS#charging-behaviour

## Manual edits

- [x] Override the price on a fixed-price line to $3.50 and confirm it charges $3.50 (override × 1), not $3.50 × quantity. verifies spec: FIXED_PRICE_MEDICATIONS#manual-edits
- [x] Remove a fixed-price line and confirm it is deleted like any other item and not re-added by the medication recompute. verifies spec: FIXED_PRICE_MEDICATIONS#manual-edits
- [x] Add an ad-hoc item with no price-list entry, set a price and quantity, and confirm it charges price × quantity — ad-hoc items are never fixed. verifies spec: FIXED_PRICE_MEDICATIONS#manual-edits

## When the fee applies

- [x] Dispense/administer at least one unit of a medication on a fixed-price price list and confirm the line is added at the flat fee. verifies spec: FIXED_PRICE_MEDICATIONS#when-the-fee-applies
- [x] Prescribe a medication with nothing dispensed/administered and confirm no fixed-price line is added. verifies spec: FIXED_PRICE_MEDICATIONS#when-the-fee-applies
- [x] Increase the dispensed quantity on a fixed-price line (recompute) and confirm the charged amount is unchanged. verifies spec: FIXED_PRICE_MEDICATIONS#charging-behaviour

## Import — charging tab

The **Invoice Price List Charging** tab: rows = invoice products, columns = price-list codes, cells = `flatFee`/`perUnit`.

- [x] Import a `flatFee` cell for a medication and confirm it becomes fixed price; import `perUnit` and confirm it becomes per-unit. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Import a charging value for a medication that already has a price and confirm the charging type merges onto the existing price-list entry — price preserved, no duplicate row. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Import `FlatFee` with odd casing and surrounding whitespace and confirm it is matched. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Import a sparse sheet (a value in one price-list column, blank in another) and confirm only the filled cell is applied and the blank is skipped. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Import an unknown cell value (e.g. `sometimes`) and confirm it raises an import error. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Import `flatFee` against a non-medication product and confirm it raises an import error. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Import `perUnit` against a non-medication product and confirm it imports without error as per-unit. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Re-import the charging tab with a changed value and confirm it flips the charging type on the existing item. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Import the price tab (plain numbers and `hidden`) and confirm it is unaffected by the charging tab.

## Export round-trip

- [x] Export the charging tab and confirm it includes medications only, emitting `flatFee` for fixed-price items and `perUnit` otherwise. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type
- [x] Export then re-import the price and charging tabs and confirm identical price and charging type for every item. verifies spec: FIXED_PRICE_MEDICATIONS#configuring-charging-type

## Display / printout

- [x] On the invoice form, confirm a fixed-price medication line shows the dispensed quantity (e.g. 30), unit price $2.00, and line total $2.00. verifies spec: FIXED_PRICE_MEDICATIONS#display-on-the-invoice
- [x] On the invoice PDF printout, confirm the fixed-price line shows the same flat-fee total with no quantity multiplication. verifies spec: FIXED_PRICE_MEDICATIONS#display-on-the-invoice

## Migration / regression

- [x] Apply the migration and confirm existing price-list items default to per-unit.
- [x] Confirm existing per-unit price lists are unaffected after the migration — totals, discounts, and insurance for non-fixed items are unchanged.
