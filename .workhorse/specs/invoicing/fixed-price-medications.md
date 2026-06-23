---
id: FXM
---

# Fixed-price medications

A medication on a price list can be charged as a flat fee per prescription line, regardless of how many units are dispensed. This is an alternative to the per-unit pricing used for most products. Whether a medication is fixed-price or per-unit is decided per price list, so the same medication can be fixed-price in one price list and per-unit in another.

## Pricing behaviour

- [ ] A fixed-price medication line is charged the configured fixed fee once, no matter how many units are dispensed against the line
- [ ] A medication line attracts its fee only once at least one unit has been dispensed or administered; if nothing is dispensed, no fee applies
- [ ] Each prescription line for a fixed-price medication is charged independently, so two separate lines for the same fixed-price medication on a visit produce two fees
- [ ] Discounts apply proportionally to the fixed fee
- [ ] Insurance coverage applies proportionally to the fixed fee
- [ ] Totals, coverage, and net-cost calculations across the invoice reflect the fixed fee directly; the dispensed quantity does not influence the amount charged on a fixed-price line

## Quantity display

- [ ] The dispensed quantity for a fixed-price medication line is shown on the invoice in the same way as for a per-unit line

## Price list configuration

- [ ] Each medication entry on a price list is either fixed-price or per-unit
- [ ] Per-unit is the default for any medication on a price list
- [ ] A medication entry on a price list is in one of these states: empty (no price), priced per unit, priced as a fixed fee, or hidden
- [ ] Fixed-price and hidden cannot both apply to the same entry
- [ ] Only medication entries can be configured as fixed-price

## Importing price lists

Price lists are imported from a spreadsheet tab with one row per invoice product and one column per price list code. Each cell carries the price (or a marker) for that product in that price list.

- [ ] A price list column header prefixed with the token `fixed` (case-insensitive, separated from the code by whitespace) marks the column as fixed-by-default: every plain numeric cell in that column is treated as a fixed fee
- [ ] A column with no `fixed` header token treats plain numeric cells as per-unit prices
- [ ] An individual cell can override the column default by prefixing its number with `f` (case-insensitive), for example `f2.00`; the cell is then treated as a fixed fee regardless of the column default
- [ ] Cell parsing tolerates surrounding whitespace and is case-insensitive for the `f` prefix
- [ ] A cell containing the hidden marker carries no price and is hidden; the hidden and fixed-price markers cannot be combined on a single cell
- [ ] The `fixed` header token is stripped from the header before the price list code is matched, so it does not interfere with finding the price list
