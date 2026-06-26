# Outpatient & ED Encounter Fees — Test Cases (TAM-6898)

Scenarios that verify the encounter fee is added correctly at encounter start, buckets by facility-local time, handles the ED and pharmacy cases, and stays idempotent. Pairs with `outpatient-encounter-fees-plan.md`.

**Setup:** invoicing enabled globally; a facility with the normal-hours window configured and standard / after-hours / weekend / ED fee products priced in a matching price list; a dedicated pharmacy department (`medications.medicationDispensing.automaticEncounterDepartmentId`); a `pharmacyEncounterFee` product priced on the facility price list to charge pharmacy, or left unpriced to skip it.

## Outpatient bucketing

- [ ] Clinic encounter starting Tue 10:00 facility-local → invoice has one **standard-hours** fee line at the configured price
- [ ] Clinic encounter starting Tue 18:30 → one **after-hours** fee line
- [ ] Clinic encounter starting Sat 11:00 → one **weekend** fee line
- [ ] Clinic encounter starting Fri 17:30 → **weekend** fee (weekend window opens Fri 17:01)
- [ ] Clinic encounter starting Mon 07:30 → **weekend** fee; starting Mon 08:00 → **standard** (window closes Mon 07:59)
- [ ] In a facility whose local time differs from the primary timezone, an encounter stored near midnight buckets by **facility-local** time, not primary

## ED fee

- [ ] Triage encounter created → one **ED fee** line added at creation
- [ ] Emergency and observation encounters → ED fee line (same product)
- [ ] Patient admitted directly from ED (triage → admission): the ED fee **remains** on the invoice (added at triage, not removed by the type change)

## Idempotency & cashier editing

- [ ] Re-running the fee add for the same encounter (re-save / re-sync) → still exactly **one** fee line, no duplicate
- [ ] Cashier removes the auto-added fee → it is **not re-added** on a later re-run / re-sync
- [ ] Cashier adjusts the fee amount → the adjustment persists (behaves like a manual item)

## Pharmacy walk-in

- [x] Where the `pharmacyEncounterFee` product is **priced**, a pharmacy-department encounter → one **flat pharmacy fee** line (not a clinic fee)
- [x] Where the `pharmacyEncounterFee` product is **unpriced**, a pharmacy-department encounter → **no fee** line (charging is opt-in)
- [x] A regular clinic-department encounter still gets the **clinic** fee, regardless of pharmacy pricing
- [x] Selection is by the encounter's department, not a flag — covered at the model layer in `EncounterFee.test.js`

## Gating & edge cases

- [ ] Invoicing disabled globally → no invoice and no fee
- [ ] Excluded encounter types (`surveyResponse`, `vaccination`) → no invoice/fee
- [ ] A `$0`-priced fee product → renders as a `$0` line item (not omitted, no error)
