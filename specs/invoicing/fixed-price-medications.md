---
id: FIXED_PRICE_MEDICATIONS
---

# Fixed-price medications

A medication can be charged a flat fee regardless of the quantity dispensed, instead of price × quantity. Fixed pricing is set per medication per price list; per-unit charging is the default, and only medications can be fixed price.

## Charging behaviour

- [x] A fixed-price medication is charged its flat fee once, regardless of the quantity dispensed — the line total equals the fee, never fee × quantity.
- [x] Charging type is set per medication per price list: the same medication can be fixed price in one price list and per-unit in another.
- [x] Per-unit charging (fee × quantity) is the default for every product.
- [x] The dispensed quantity is derived and displayed as usual, but on a fixed-price line it is informational only and never changes the charged amount.
- [x] The fee is charged on the medication line itself, with no separate fee line.

## Discounts and insurance

- [x] A discount applies to the flat fee, not to fee × quantity — a 10% discount on a $2.00 fixed-price line gives $1.80.
- [x] Insurance coverage applies proportionally to the discounted flat fee — 80% coverage on a $2.00 fixed-price line covers $1.60 and the patient owes $0.40.
- [x] Coverage on a fixed-price line is capped at the discounted flat fee and never exceeds it.
- [x] Net cost, coverage, and invoice totals for a fixed-price line all derive from the flat fee; quantity never enters any of them.

## When the fee applies

- [x] The fee is charged once at least one unit has been dispensed or administered; nothing dispensed means no fee.
- [x] The fee is identical whether one unit or many are dispensed.

## Manual edits

- [x] A fixed-price line can be edited or removed like any other invoice item.
- [x] Overriding the price on a fixed-price line keeps it fixed: the line is charged the override amount once (override × 1), not override × quantity.
- [x] A manually added item that is not linked to a price-list entry is charged per-unit — fixed pricing comes only from a price-list entry.

## After finalisation

- [x] A fixed-price line stays fixed once the invoice is finalised, even if the price-list entry is later changed or removed; its charging type is captured at finalisation alongside its price, so the line is never recomputed as price × quantity.

## Display on the invoice

- [x] A fixed-price medication line shows the dispensed quantity and a line total equal to the flat fee, on both the invoice form and the printed invoice.

## Configuring charging type

Charging type is configured through the reference-data spreadsheet, in an **Invoice Price List Charging** tab that is separate from the price tab so prices stay purely numeric. Each row is an invoice product, each column is a price list, and each cell holds the charging type for that medication in that price list.

- [x] A cell value of `flatFee` makes the medication fixed price in that price list; `perUnit` leaves it per-unit. Matching is case-insensitive and ignores surrounding whitespace.
- [x] A blank cell is skipped and leaves the medication per-unit, so a sparse sheet round-trips without changing untouched rows.
- [x] `flatFee` is accepted only for medications; `flatFee` against a non-medication product is rejected on import. `perUnit` is accepted for any product.
- [x] Any cell value other than `flatFee`, `perUnit`, or blank is rejected on import.
- [x] The charging type merges onto the medication's existing price-list entry rather than creating a duplicate.
- [x] Export emits the Invoice Price List Charging tab for medications only, and exporting then re-importing the price and charging tabs reproduces the same price and charging type for every item.
