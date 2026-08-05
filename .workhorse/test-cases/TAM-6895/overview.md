# Discharge medications — test cases

Scenarios verifying dispensing quantity and pharmacy ordering on the discharge form
(spec: DISCHMED). They run across two layers: **column** unit tests
(`packages/web/__tests__/forms/DischargeForm.test.jsx`) and **endpoint** integration tests
(`packages/facility-server/__tests__/apiv1/Encounter.test.js`). Scenarios cite the criterion they
exercise; UI interaction scenarios are manual until an E2E journey covers them.

## Dispensing quantity

- [x] Confirm the quantity column is labelled "Dispensing qty" and carries a required marker. verifies spec: DISCHMED#dispensing-quantity
- [x] Confirm the quantity input requires a value, and rejects zero on a medication being sent to pharmacy. verifies spec: DISCHMED#dispensing-quantity
- [ ] Leave a dispensing quantity at 0 in the encounter medication table and confirm finalising the discharge is blocked with an inline required message. verifies spec: DISCHMED#dispensing-quantity
- [ ] Clear the dispensing quantity on an other ongoing medication row and confirm finalising is blocked there too. verifies spec: DISCHMED#dispensing-quantity
- [ ] Tick an other ongoing medication to send to pharmacy, leave its quantity at 0, and confirm finalising is blocked. verifies spec: DISCHMED#dispensing-quantity
- [ ] Leave a quantity at 0 on a row not being sent to pharmacy and confirm the discharge still finalises. verifies spec: DISCHMED#dispensing-quantity
- [ ] Confirm quantities are still required when pharmacy orders are disabled for the deployment. verifies spec: DISCHMED#dispensing-quantity
- [ ] Set a valid quantity on every row and confirm the discharge finalises. verifies spec: DISCHMED#dispensing-quantity

## Pharmacy columns and gating

- [x] Confirm send-to-pharmacy, last sent, and stock are all absent when pharmacy orders are not enabled. verifies spec: DISCHMED#pharmacy-ordering
- [x] Confirm send-to-pharmacy and last sent appear when pharmacy orders are enabled. verifies spec: DISCHMED#pharmacy-ordering
- [x] Confirm the pharmacy columns sit after Ongoing and before the discontinue action.
- [ ] Confirm a user without permission to create medication requests sees no pharmacy columns. verifies spec: DISCHMED#pharmacy-ordering

## Selecting medications to send

- [ ] Open the discharge form and confirm every encounter medication is ticked to send to pharmacy. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Confirm no other ongoing medication is ticked. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Untick every medication and confirm the ordering prescriber field becomes inactive. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Tick one medication again and confirm the ordering prescriber field becomes active. verifies spec: DISCHMED#pharmacy-ordering

## Ordering prescriber

- [ ] Open the discharge form and confirm ordering prescriber defaults to the logged-in user. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Clear the ordering prescriber with a medication still selected and confirm finalising is blocked with a required message. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Confirm the field carries a tooltip explaining it is the prescriber placing the order. verifies spec: DISCHMED#pharmacy-ordering
- [x] Send a discharge that selects medications but omits the ordering prescriber and confirm it is rejected. verifies spec: DISCHMED#pharmacy-ordering

## Placing the order

- [x] Finalise a discharge with a medication selected and confirm one pharmacy order is created for the encounter, with the row's quantity and repeats. verifies spec: DISCHMED#pharmacy-ordering
- [x] Confirm the order is recorded as an Outpatient/Discharge prescription. verifies spec: DISCHMED#pharmacy-ordering
- [x] Finalise a discharge with nothing selected and confirm no pharmacy order is created. verifies spec: DISCHMED#pharmacy-ordering
- [x] Force the order to fail and confirm the discharge rolls back — no order, no discharge, encounter still open. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Set the deployment's default prescription type to Inpatient, finalise a discharge, and confirm the order is still Outpatient/Discharge. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Select an ongoing medication, finalise, then open Send to pharmacy from the patient's ongoing medications and confirm the row shows the discharge's date under Last sent. verifies spec: DISCHMED#pharmacy-ordering
- [ ] Finalise a discharge selecting a medication sent within the already-ordered window and confirm the confirmation step lists it, and Back returns to the form with the selection intact. verifies spec: DISCHMED#pharmacy-ordering

## Last sent

- [x] Confirm a medication never sent to pharmacy shows as not applicable. verifies spec: DISCHMED#last-sent
- [x] Confirm a medication with an undispensed request shows an active request. verifies spec: DISCHMED#last-sent
- [x] Confirm a medication whose request has been dispensed shows dispensed. verifies spec: DISCHMED#last-sent
- [x] Send a medication twice, dispense only the older request, and confirm the column reports the newer request's date and active state. verifies spec: DISCHMED#last-sent
- [x] Confirm the dispensed state is null for a medication never sent. verifies spec: DISCHMED#last-sent
- [ ] Amend a dispense and confirm the medication returns to showing an active request. verifies spec: DISCHMED#last-sent

## Stock

- [x] Confirm the stock column is dropped when no listed medication has a stock status. verifies spec: DISCHMED#stock
- [x] Confirm the stock column appears when a medication has a stock status. verifies spec: DISCHMED#stock
- [ ] Confirm in-stock, out-of-stock, and unknown medications read Yes, No, and Unknown. verifies spec: DISCHMED#stock
- [ ] Hover an in-stock medication and confirm the tooltip gives the stock level held. verifies spec: DISCHMED#stock
- [ ] Confirm the discharge form's stock values match the Dispense medication modal for the same medications. verifies spec: DISCHMED#stock

## Drafts

- [ ] Tick medications, change quantities and the ordering prescriber, Save & exit, reopen, and confirm all three are restored. verifies spec: DISCHMED#saving-a-draft
- [ ] Save a draft with medications ticked and confirm no pharmacy order is created. verifies spec: DISCHMED#saving-a-draft

## Regression

- [ ] Confirm the note directing users to send to pharmacy from the encounter no longer appears on the discharge form.
- [x] Confirm both medication tables build their columns from the same options, so permission handling cannot diverge between them.
- [x] Confirm sensitive-medication quantity, repeats, and discontinue behaviour is unchanged for users with and without write permission.
- [ ] Discharge a patient with pharmacy orders disabled and confirm the discharge summary printout is unchanged.
