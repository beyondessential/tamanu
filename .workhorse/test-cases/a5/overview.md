# Test cases: reason for a discount, markup or sliding fee

Covers the invoice item row hover tooltip and the invoice-level discount reason in both the web
summary panel and the printed invoice.

## Invoice item row tooltip

- [x] An item with a saved discount and a recorded reason reveals that reason on hover
- [x] An item with a saved markup and a recorded reason reveals that reason on hover
- [x] An item whose adjustment has no recorded reason shows no tooltip on hover
- [ ] The tooltip is reachable on a finalised invoice, where rows render read-only
- [ ] The tooltip does not appear while a row is being edited, and returns once the row is saved
- [ ] A row with both an adjustment reason and insurance rows expanded still shows the tooltip

## Invoice-level discount reason (web summary panel)

- [x] A manual discount shows the reason the cashier typed
- [x] A sliding fee scale discount, which stores no free-text reason, shows that it came from the patient assessment
- [x] A manual discount saved without a reason shows no reason line
- [x] An invoice with no discount shows no reason line
- [ ] The reason line is absent when the sliding fee scale feature is switched off
- [ ] A long manual reason wraps within the summary panel rather than overflowing it

## Printed invoice

- [ ] A manual discount prints its reason under "Discount reason"
- [ ] A sliding fee scale discount prints the patient-assessment reason under "Discount reason"
- [ ] An invoice with no discount prints no "Discount reason" item
- [ ] The printed reason matches what the web summary panel shows for the same invoice

## Regression guard

- [ ] Applying, then removing, a sliding fee scale leaves no stale reason line behind
- [ ] Item-level adjustment amounts and totals are unchanged by the tooltip markup fix
