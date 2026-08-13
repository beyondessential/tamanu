---
id: PHDIS
---

# Discontinued medications in pharmacy

A prescription can be discontinued at any time, including after it has been sent to pharmacy. Once a pharmacy order exists, discontinuation warns the dispensing pharmacist rather than blocking them: the request stays visible so the pharmacist keeps sight of what was ordered, and they decide whether dispensing is still appropriate. The flag stays with the request through dispensing and onto the dispensed record.

## Ordering

- [ ] A discontinued prescription cannot be added to a new pharmacy order.

## Pharmacy queue

- [ ] A medication request whose prescription has since been discontinued remains in the pharmacy queue.
- [ ] The queue marks such a request as discontinued, so a pharmacist sees the status before opening the dispense workflow.

## Dispensing

- [ ] Discontinued requests appear in the dispense workflow alongside the patient's other requests.
- [ ] The dispense workflow warns the pharmacist when any of the listed requests have been discontinued.
- [ ] Each discontinued request is marked as discontinued in the dispense workflow, and the date it was discontinued and the reason recorded are available to the pharmacist.
- [ ] A discontinued request is not selected for dispensing by default, so it cannot be dispensed without the pharmacist explicitly selecting it.
- [ ] Selecting a discontinued request and dispensing it succeeds, and is recorded the same way as dispensing any other request.

## Dispensed records

The flag follows the fill after dispensing, so anyone reviewing what was handed out can see it was dispensed against a discontinued prescription.

- [ ] The dispensed medications list marks a fill whose prescription has been discontinued.
- [ ] The dispensed medication details show the same mark, alongside the medication dispensed.
- [ ] The patient's own list of dispensed medications marks such a fill the same way.
- [ ] Editing a dispensed medication shows the mark against the medication being edited.
- [ ] Where a fill is marked both as discontinued and as modified by pharmacy, both marks are shown.
