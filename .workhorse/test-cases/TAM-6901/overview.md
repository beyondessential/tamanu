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
