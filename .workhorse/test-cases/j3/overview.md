# Test cases: dispense medication modal shows stale data

Covers the dispense modal building its table from a cached dispensable-medications
response that predates a change made elsewhere (cancelling a dispense, editing one,
deleting a request).

## Dispense modal list freshness

- [x] Opening the dispense modal for a patient lists their dispensable medications
- [x] Opening the modal when a stale cached list is present shows the refetched list, not the cached one
- [ ] Cancel a dispensed medication, return to Active medication requests, and click the medication straight away: the modal lists the medication (the reported defect)
- [ ] The same flow with a wait of several minutes between cancelling and clicking still lists the medication
- [ ] Cancel a dispense from the patient's Medication tab, then open the dispense modal for that patient: the medication is listed
- [ ] Edit a dispense's quantity, then reopen the dispense modal for that patient: the modal reflects the edit
- [ ] Delete an active medication request, then open the dispense modal for that patient: the deleted request is not listed
- [ ] The modal shows its loading state while the list is being fetched, and never shows "No data" before the fetch settles
- [x] The table is never rendered empty between the response arriving and the list being built, so "No data" does not flash on the way to the list

## No regression to in-progress edits

- [ ] Modify a prescription in the modal, then reopen the modify modal for another row: the first row keeps its modification
- [ ] Change a row's quantity and label text, wait on the modal, and confirm the entered values are not reset
- [x] A patient with genuinely nothing to dispense shows "No data" rather than a permanent loading state
