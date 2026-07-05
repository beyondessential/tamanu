# Outpatient and ED encounter fees — test cases (TAM-6898)

Scenarios that verify the encounter fee is added correctly at encounter start, buckets by facility-local time, handles the ED and pharmacy cases, and stays idempotent.

**Setup:** invoicing enabled globally (`features.invoicing.enabled` → `true`); a facility with the outpatient and emergency normal-hours windows configured (`invoicing.encounterFee.standardHoursStart` / `…End` and `…emergencyStandardHoursStart` / `…End`) and the six encounter-fee products — outpatient standard / after-hours / weekend and ED standard / after-hours / weekend — priced in a matching price list; a dedicated pharmacy department (`medications.medicationDispensing.automaticEncounterDepartmentId`); a `pharmacyEncounterFee` product priced on the facility price list to charge pharmacy, or left unpriced to skip it. Earlier manual scenarios were exercised at facility-1 (outpatient standard $50, after-hours $80, weekend $120, pharmacy $25); the ED fee is now time-bucketed, so the ED bucket products need pricing and the ED cases below re-testing.

## Outpatient bucketing

- [x] Start a clinic encounter at standard hours (e.g. Tue 10:00 facility-local); confirm the invoice shows one standard-hours fee line at the configured price (verifies spec: FEES)
- [ ] Start a clinic encounter at Tue 18:30; confirm one after-hours fee line (verifies spec: FEES)
- [ ] Start a clinic encounter at Tue 06:00 (before the window opens); confirm one after-hours fee line (verifies spec: FEES)
- [ ] Start a clinic encounter at Sat 11:00; confirm one weekend fee line (verifies spec: FEES)
- [ ] Start clinic encounters at Tue 08:00 and Tue 17:00 (the configured window boundaries); confirm each gets a standard-hours fee — the in-hours boundaries are inclusive (verifies spec: FEES)
- [ ] Start a clinic encounter at Fri 17:30 and confirm a weekend fee (the weekend window opens at the standard-hours end on Friday); start one Fri 10:00 and confirm a standard fee (verifies spec: FEES)
- [ ] Start a clinic encounter at Mon 07:30 and confirm a weekend fee; start one at Mon 08:30 and confirm a standard fee (the weekend window closes at the standard-hours start on Monday) (verifies spec: FEES)
- [ ] Move the facility's `standardHoursStart` / `standardHoursEnd` window and re-run the same start time; confirm the bucket changes accordingly (the boundary is facility-configurable) (verifies spec: FEES)
- [ ] In a facility whose local time differs from the primary timezone, start an encounter stored near midnight and confirm it buckets by facility-local time, not primary (verifies spec: FEES)
- [ ] Configure a facility with no distinct weekend product (weekend left absent); start a weekend clinic encounter and confirm it resolves the after-hours product (weekend falls back to after-hours) (verifies spec: FEES)
- [ ] Confirm the standard / after-hours / weekend products are matched by their stable encounter-fee codes, with the per-facility amount coming from the price list (verifies spec: FEES)

## Age and price-list variation

- [ ] Configure two facility price lists for the same fee product differing only by `patientAge` rule; start clinic encounters for a patient in each age band and confirm the fee amount matches the age-matched price list (fees are optionally age-based through the price list) (verifies spec: FEES)
- [ ] Confirm the fee flows through the same price-list engine as other invoice items — per-facility rate, patient-type and insurance-eligibility rules apply, with no fee-specific pricing path (verifies spec: FEES)

## ED fee

- [ ] Create a weekday in-hours triage encounter; confirm one **ED standard-hours** fee line is added at creation (verifies spec: FEES)
- [ ] Create emergency and observation (emergency short-stay) encounters in hours; confirm each gets the **ED standard-hours** fee (one emergency family) (verifies spec: FEES)
- [ ] Create emergency-family encounters at a weekday evening and on a weekend; confirm the **ED after-hours** and **ED weekend** fees respectively — the ED fee is time-bucketed like the outpatient fee (verifies spec: FEES)
- [ ] Set the emergency hours window different from the outpatient window; confirm an ED encounter buckets against the **emergency** window while a clinic encounter at the same time still buckets against the **outpatient** window (verifies spec: FEES)
- [ ] Leave the ED weekend product unpriced; confirm a weekend ED encounter falls back to the **ED after-hours** product (verifies spec: FEES)
- [ ] Admit a patient directly from ED (triage → admission); confirm the ED fee remains on the invoice (added at triage, not removed by the type change) (verifies spec: FEES)

## Idempotency and cashier editing

- [ ] Re-run the fee add for the same encounter (re-save / re-sync); confirm still exactly one fee line, no duplicate — the line is anchored to the encounter (verifies spec: FEES)
- [ ] Remove the auto-added fee as a cashier (soft-delete), then re-run / re-sync; confirm it is not re-added (verifies spec: FEES)
- [ ] Adjust the fee amount as a cashier; confirm the adjustment persists (behaves like a manual item) (verifies spec: FEES)
- [ ] Trigger an end-of-day clinic auto-discharge on an encounter that already has its fee; confirm the fee line survives the auto-discharge (added at start, not discharge) (verifies spec: FEES)

## Pharmacy walk-in

- [x] With the `pharmacyEncounterFee` product priced, start a pharmacy-department encounter; confirm one flat pharmacy fee line (not a clinic fee) (verifies spec: FEES)
- [x] With the `pharmacyEncounterFee` product unpriced, start a pharmacy-department encounter; confirm no fee line (charging is opt-in) (verifies spec: FEES)
- [x] Start a regular clinic-department encounter; confirm it still gets the clinic fee, regardless of pharmacy pricing (verifies spec: FEES)
- [x] Confirm selection is by the encounter's department (compared to the configured pharmacy department), not a flag — covered at the model layer (verifies spec: FEES)
- [ ] Confirm both the clinic and pharmacy products live on the one facility price list (no department-scoped list) (verifies spec: FEES)

## Gating and edge cases

- [ ] Disable invoicing globally (`features.invoicing.enabled` → false); confirm no invoice and no fee (verifies spec: FEES)
- [ ] Create excluded encounter types (`surveyResponse`, `vaccination`); confirm no encounter fee is added (verifies spec: FEES)
- [ ] Price a clinic fee product at $0 (present but unpriced); confirm it renders as a $0 line item (not omitted, no error) so misconfiguration stays visible (verifies spec: FEES)
- [ ] Hide the clinic fee product on the facility price list (isHidden); confirm no fee line is added (a facility suppresses a clinic fee by hiding the product) (verifies spec: FEES)
