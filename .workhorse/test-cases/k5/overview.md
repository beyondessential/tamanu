# Test cases: Clearing "Details" in Edit invoice must not silently delete the line

Covers the Edit invoice form's line-item validation, focused on the regression where clearing the "Details" (product) field dropped an existing line on save with no warning.

## Edit invoice — existing lines

- [ ] Clearing "Details" on an existing line and clicking Save changes is blocked with "*Required" on Details; the line is not removed.
- [ ] Clearing "Ordered by" on an existing line is still blocked with "*Required" (unchanged behaviour).
- [ ] Clearing both "Details" and "Ordered by" on an existing line is blocked (Details shows "*Required"); nothing is saved.
- [ ] A valid edit (change quantity / ordered-by, product kept) saves and persists all existing lines.
- [ ] Removing a line still works only via the kebab → Delete action with its confirmation.

## Add invoice items — blank rows still discardable

- [ ] In Add items mode, a blank row that was never given a product is discarded silently on save (no "*Required" block).
- [ ] In Add items mode, a row given a manual price but no product is blocked with "*Required" on Details.

## Notes

- "Details" is the product autocomplete (`invoiceItems.${index}.productId`). The fix tags already-saved lines (`isExistingItem`) so their product/ordered-by stay required, while untagged blank add-rows remain discardable.
- Suited to a web unit test over `invoiceFormSchema` (assert `validate` rejects an existing line with empty `productId`, accepts a blank non-existing row) and/or a Playwright case extending `packages/e2e-tests/tests/invoicing/invoicing.spec.ts`.
