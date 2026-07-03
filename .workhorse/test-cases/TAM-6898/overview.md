# Outpatient and ED encounter fees — test cases (TAM-6898)

Scenarios that verify the encounter fee is added correctly at encounter start, buckets by facility-local time, handles the ED and pharmacy cases, and stays idempotent.

**Setup:** invoicing enabled globally (`features.invoicing.enabled` → `true`); a facility with the normal-hours window configured (`invoicing.encounterFee.standardHoursStart` / `…End`) and standard / after-hours / weekend / ED fee products priced in a matching price list; a dedicated pharmacy department (`medications.medicationDispensing.automaticEncounterDepartmentId`); a `pharmacyEncounterFee` product priced on the facility price list to charge pharmacy, or left unpriced to skip it. Manual scenarios below were exercised at facility-1 with fees priced on the catch-all facility price list (standard $50, after-hours $80, weekend $120, ED $150, pharmacy $25).

## Outpatient bucketing

- [x] Start a clinic encounter at standard hours (e.g. Tue 10:00 facility-local); confirm the invoice shows one standard-hours fee line at the configured price (verifies spec: FEES)
- [ ] Start a clinic encounter at Tue 18:30; confirm one after-hours fee line (verifies spec: FEES)
- [ ] Start a clinic encounter at Sat 11:00; confirm one weekend fee line (verifies spec: FEES)
- [ ] Start a clinic encounter at Fri 17:30; confirm a weekend fee (the weekend window opens Fri 17:01) (verifies spec: FEES)
- [ ] Start a clinic encounter at Mon 07:30 and confirm a weekend fee; start one at Mon 08:00 and confirm a standard fee (the window closes Mon 07:59) (verifies spec: FEES)
- [ ] In a facility whose local time differs from the primary timezone, start an encounter stored near midnight and confirm it buckets by facility-local time, not primary (verifies spec: FEES)

## ED fee

- [x] Create a triage encounter; confirm one ED fee line is added at creation (verifies spec: FEES)
- [ ] Create emergency and observation encounters; confirm each gets an ED fee line from the same product (verifies spec: FEES)
- [ ] Admit a patient directly from ED (triage → admission); confirm the ED fee remains on the invoice (added at triage, not removed by the type change) (verifies spec: FEES)

## Idempotency and cashier editing

- [ ] Re-run the fee add for the same encounter (re-save / re-sync); confirm still exactly one fee line, no duplicate (verifies spec: FEES)
- [ ] Remove the auto-added fee as a cashier, then re-run / re-sync; confirm it is not re-added (verifies spec: FEES)
- [ ] Adjust the fee amount as a cashier; confirm the adjustment persists (behaves like a manual item) (verifies spec: FEES)

## Pharmacy walk-in

- [x] With the `pharmacyEncounterFee` product priced, start a pharmacy-department encounter; confirm one flat pharmacy fee line (not a clinic fee) (verifies spec: FEES)
- [x] With the `pharmacyEncounterFee` product unpriced, start a pharmacy-department encounter; confirm no fee line (charging is opt-in) (verifies spec: FEES)
- [x] Start a regular clinic-department encounter; confirm it still gets the clinic fee, regardless of pharmacy pricing (verifies spec: FEES)
- [x] Confirm selection is by the encounter's department, not a flag — covered at the model layer (verifies spec: FEES)

## Gating and edge cases

- [ ] Disable invoicing globally; confirm no invoice and no fee (verifies spec: FEES)
- [ ] Create excluded encounter types (`surveyResponse`, `vaccination`); confirm no invoice and no fee (verifies spec: FEES)
- [ ] Price a fee product at $0; confirm it renders as a $0 line item (not omitted, no error) (verifies spec: FEES)
