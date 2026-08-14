# Test cases — Discharge modal: Ordering prescriber survives discontinue

Covers the regression where discontinuing a medication in the discharge modal reverted the
clinician's chosen "Ordering prescriber" back to the auto-populated current user.

## Discharge modal — ordering prescriber

- [ ] With pharmacy orders enabled and at least one encounter medication sent to pharmacy by
      default, open the discharge modal, change "Ordering prescriber" to a different clinician,
      discontinue a listed medication (leaving "Discontinued by" as the default), and confirm the
      "Ordering prescriber" still shows the clinician the user picked.
- [ ] After a discontinue, the discontinued medication is no longer listed and no longer counts
      toward the discharge (not sent to pharmacy, not submitted), while the remaining medications
      keep the quantity/repeats/send-to-pharmacy values the user had entered.
- [ ] Other user edits made before a discontinue survive it too: discharge date, discharging
      clinician, disposition, and the discharge notes field.
- [ ] The discharge modal shows a loading state until encounter medications, ongoing prescriptions,
      and discharge notes have loaded, then renders the form once with those values in place.
- [ ] A discharge notes fetch failure still lets the form render (empty notes) rather than leaving
      the modal stuck on the loading state.
