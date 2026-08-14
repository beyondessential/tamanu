# A5: reason for a discount, markup or sliding fee

## Root cause of the reported regression

The item-row tooltip was implemented but never worked. In `PriceCell.jsx`, `DiscountSection` passed
the reason to `ThemedTooltip` as its `title`, but the tooltip's child was a React fragment. MUI v4's
`Tooltip` clones its child to attach a ref and the hover handlers, and a fragment can hold neither,
so the handlers were dropped silently and the tooltip never opened.

The codebase already knew this: `Tooltip.jsx` wraps `ConditionalTooltip`'s children in a `div` with
the comment "div is needed to make ThemedTooltip work". `DiscountSection` was the one place that
did not.

On the timeline the card asked to pin down: `DiscountSection` arrived with the epic-invoicing
rewrite (SAV-1047 #8759, phase 2 #9044, ~2.49) and has wrapped its content in a fragment since the
first commit. 2.13's invoicing was a different implementation, so "worked in 2.13, broken since
2.49" means it never worked once the current UI shipped, rather than a later refactor removing it.

Fix: wrap the reason rows in a styled `div` (`DiscountRows`) so MUI has an element to bind to.

## Sliding fee reason: why no schema change

The card also asks for the sliding fee reason to be visible, including on the printout. This is a
feature gap rather than the regression, and it splits by discount kind:

- A **manual** invoice discount captures free-text `reason`. It was already printed under
  "Discount reason" but was never shown in the web summary panel.
- A **sliding fee scale** discount stores no reason at all. `InvoiceDiscountAssessmentForm` saves
  only `{ percentage, isManual: false }`; the family size and income band the operator selected are
  discarded.

Recording the assessment detail would need two new columns on `invoice_discounts`, a migration, and
a regenerated dbt source model. This card targets `release/2.62`, so a schema change here would put
a migration into a patch release for a feature gap. That was judged not worth the risk.

Instead the display falls back on `isManual`, which already exists on the model and is already
returned by the invoice GET (the `discount` association carries no attribute filter): a manual
discount shows its recorded reason, and a sliding fee scale discount is labelled as coming from the
patient assessment. Web and printout share the same string id so they cannot drift.

If the assessment detail (family size, income band) is wanted in that label, it needs the migration
above and should target `main` rather than this release branch.

## Steps

- [x] Pin down when the tooltip broke
- [x] Fix the fragment-child tooltip in `PriceCell.jsx`
- [x] Add the missing `reason` field to the `InvoiceDiscount` / `InvoiceItemDiscount` types
- [x] Show the invoice discount reason in the web summary panel
- [x] Fall back to naming the patient assessment for sliding fee scale discounts
- [x] Mirror the same fallback on the printed invoice
- [x] Cover the tooltip and the summary panel reason with unit tests
- [ ] Decide whether recording the assessment detail should be a follow-up card on `main`

## Not addressed

Item-level adjustment reasons still do not appear anywhere on the printout — the printout's
`OrderedByCellWithAdjustments` / `PriceCellWithAdjustments` render the amounts under hardcoded
"Item adjustment" / "Cost after adjustment" labels with no reason. That was option 3 in the scoping
discussion and was not taken up.
