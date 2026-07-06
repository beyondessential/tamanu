# Inpatient fee inclusions / exclusions — test cases (TAM-6901)

Scenarios that verify per-facility category bundling: bundled categories don't auto-add for admissions but still do for outpatient/ER, with the medication discharge-vs-administered split and pre-admission persistence.

**Setup:** facilities configured per the inclusion table (Chuuk / Kosrae / Pohnpei / Yap) via `invoicing.inpatientFee.bundledCategories`; an admission encounter and an outpatient encounter; lab / imaging / medication / procedure products priced in a price list.

## Per-state matrix

- [ ] Yap (imaging, lab, meds bundled): on an **admission** encounter, order imaging / lab / administer meds; confirm none auto-add to the invoice (verifies spec: FEES)
- [ ] Kosrae (only meds bundled): admission encounter; confirm administered meds don't auto-add but lab and imaging **do** (verifies spec: FEES)
- [ ] Chuuk / Pohnpei (nothing bundled): admission encounter; confirm all categories auto-add as normal (verifies spec: FEES)
- [ ] Confirm bundling is per-category and per-facility from the single `invoicing.inpatientFee.bundledCategories` setting: change the list at one facility and confirm only the listed categories stop auto-adding, with other facilities unaffected (verifies spec: FEES)

## Outpatient/ER always charges

- [ ] At a bundling facility (e.g. Yap), on an **outpatient** encounter, order lab / imaging / administer meds; confirm each still auto-adds (bundling is admission-only) (verifies spec: FEES)
- [ ] At a bundling facility, on an **emergency/triage** encounter, order a bundled-category item; confirm it still auto-adds (verifies spec: FEES)

## Medications: discharge vs administered

- [ ] Bundling facility, admission encounter: confirm **administered (MAR)** meds are excluded but **discharge** prescription meds are still invoiced (verifies spec: FEES)
- [ ] Non-bundling facility: confirm both administered and discharge meds are invoiced (verifies spec: FEES)

## Procedures

- [ ] Confirm procedures always auto-add — including at a facility whose setting lists `procedure` (if configurable) and on an admission encounter — procedures are never bundled in any state (verifies spec: FEES)

## Pre-admission persistence

- [ ] Add a bundled-category item while the encounter is outpatient/ER, then change the encounter to admission; confirm the pre-admission item keeps its **full price** and is not removed, re-bundled, or re-evaluated (verifies spec: FEES)
- [ ] After that type change, order a new bundled-category item on the now-admission encounter; confirm the new item does **not** auto-add (only pre-existing items are grandfathered) (verifies spec: FEES)

## Display

- [ ] Confirm bundled items are **absent** from the invoice (not added at all, not added-then-hidden) (verifies spec: FEES)

## Kitchen-sink journey (one patient, mixed categories, partial bundling)

- [ ] At a facility bundling **`["lab", "medication"]` only** (imaging and procedures not bundled), run one continuous patient journey and confirm the final invoice matches the expected set below (verifies spec: FEES):
  1. **Pre-admission (ED/outpatient):** order a lab and prescribe + **administer** a medication (record a GIVEN MAR dose) → both appear on the invoice at full price.
  2. **Admit** the patient (encounter type → admission) → the pre-admission lab and med lines **remain unchanged** (grandfathered — not removed, not retro-bundled, quantities untouched).
  3. Post-admission, order a **new lab** → **not** added (lab is bundled for admissions).
  4. Post-admission, order **imaging** → **added** (imaging isn't bundled at this facility).
  5. Post-admission, prescribe a new med, **administer** a dose (MAR) → **not** added; then **dispense that med as a discharge pharmacy order** (qty > 0) → the **discharge** quantity is added, consolidated onto that med's single line (administered portion excluded, discharge portion billed).
  6. Post-admission, perform a **procedure** → **added** (procedures are never bundled).
  - **Expected final invoice:** pre-admission lab (full) + pre-admission med (full) + post-admission imaging + post-admission procedure + the post-admission med line at its **discharge** quantity only. **Absent:** the post-admission lab, and any administered-only portion of the post-admission med.
  - **Bonus (timing):** administer a further dose of the post-admission med *after* the discharge order — confirm it does **not** increase the invoice (doses given after the discharge pharmacy order aren't counted, and the administered portion is bundled here anyway).
