# Sliding fee scale discount test cases

Covers the assessment step of the Apply sliding fee scale modal, where a family size and an
annual income band together determine the invoice discount.

## Discount derivation

- [x] An income band maps to the discount for the family size it was selected under (7,400–17,000 at a family size of 3 gives 70%)
- [x] The last band for a family size is open-ended (`> 17,000`)
- [x] A family size the sliding fee scale does not cover offers no income bands

## Changing family size

- [x] An income band belonging to a different family size is not a valid answer
- [x] A cleared annual income is not a valid answer
- [ ] Changing family size after picking an income band blanks the annual income field, and Confirm is blocked until an income is picked again
- [ ] Reselecting an income band after changing family size applies the discount for the new family size, not the previous one
- [ ] The discount shown on the invoice after Confirm matches the band selected in the modal

## Operational

- [ ] The annual income field is disabled until a family size is chosen
- [ ] Going Back to the discount type step and returning to the assessment starts from an empty form
- [ ] An admin editing the sliding fee scale setting while the modal is open does not leave a stale discount selectable
