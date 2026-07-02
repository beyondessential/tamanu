# Inpatient Fee Inclusions / Exclusions — Test Cases (TAM-6901)

Scenarios that verify per-facility category bundling: bundled categories don't auto-add for admissions but still do for outpatient/ER, with the medication discharge-vs-administered split and pre-admission persistence. Pairs with `inpatient-fee-inclusions-exclusions-plan.md`.

**Setup:** facilities configured per the inclusion table (Chuuk / Kosrae / Pohnpei / Yap); an admission encounter and an outpatient encounter; lab / imaging / medication / procedure products priced in a price list.

## Per-state matrix

- [ ] Yap (imaging, lab, meds bundled): on an **admission** encounter, ordering imaging / lab / administering meds → none auto-add to the invoice
- [ ] Kosrae (only meds bundled): admission encounter → meds don't auto-add; lab and imaging **do**
- [ ] Chuuk / Pohnpei (nothing bundled): admission encounter → all categories auto-add as normal

## Outpatient/ER always charges

- [ ] At a bundling facility, an **outpatient/ER** encounter still auto-adds lab / imaging / meds (bundling is admission-only)

## Medications: discharge vs administered

- [ ] Bundling facility, admission encounter: **administered (MAR)** meds are excluded, but **discharge** prescription meds are still invoiced
- [ ] Non-bundling facility: both administered and discharge meds are invoiced

## Procedures

- [ ] Procedures always auto-add — in every state, on admission and outpatient (never bundled)

## Pre-admission persistence

- [ ] An item added while the encounter is outpatient/ER, then the encounter becomes admission → the pre-admission item keeps its **full price** and is not removed or re-evaluated

## Display

- [ ] Bundled items are **absent** from the invoice (not added at all, not added-then-hidden)
