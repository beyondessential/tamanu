# Inpatient fee inclusions / exclusions — test cases (TAM-6901)

Scenarios that verify per-facility category bundling: bundled categories don't auto-add for admissions but still do for outpatient/ER, with the medication discharge-vs-administered split and pre-admission persistence.

**Setup:** facilities configured per the inclusion table (Chuuk / Kosrae / Pohnpei / Yap) via `invoicing.inpatientFee.bundledCategories`; an admission encounter and an outpatient encounter; lab / imaging / medication / procedure products priced in a price list.

## Per-state matrix

- [ ] Yap (imaging, lab, meds bundled): on an **admission** encounter, ordering imaging / lab / administering meds; confirm none auto-add to the invoice (verifies spec: FEES)
- [ ] Kosrae (only meds bundled): admission encounter; confirm meds don't auto-add but lab and imaging **do** (verifies spec: FEES)
- [ ] Chuuk / Pohnpei (nothing bundled): admission encounter; confirm all categories auto-add as normal (verifies spec: FEES)

## Outpatient/ER always charges

- [ ] At a bundling facility, on an **outpatient/ER** encounter, order lab / imaging / administer meds; confirm each still auto-adds (bundling is admission-only) (verifies spec: FEES)

## Medications: discharge vs administered

- [ ] Bundling facility, admission encounter: confirm **administered (MAR)** meds are excluded but **discharge** prescription meds are still invoiced (verifies spec: FEES)
- [ ] Non-bundling facility: confirm both administered and discharge meds are invoiced (verifies spec: FEES)

## Procedures

- [ ] Confirm procedures always auto-add — in every state, on admission and outpatient (never bundled) (verifies spec: FEES)

## Pre-admission persistence

- [ ] Add an item while the encounter is outpatient/ER, then make the encounter admission; confirm the pre-admission item keeps its **full price** and is not removed or re-evaluated (verifies spec: FEES)

## Display

- [ ] Confirm bundled items are **absent** from the invoice (not added at all, not added-then-hidden) (verifies spec: FEES)
