# Inpatient Fee Inclusions / Exclusions — Implementation Plan (TAM-6901)

Per-facility control of which item categories (imaging / lab / medications) are bundled into the admission fee and therefore **don't** auto-add for admission encounters — while still auto-adding for outpatient/ER. Discharge meds are always invoiced; procedures are never bundled; pre-admission items keep full price. Needs the facility-settings block from the foundation but is otherwise independent of the fee products — see `fee-engine-build-order.md`.

## Technical approach

- One facility-scoped setting lists the bundled categories. Each clinical-item auto-add path gains a guard: **skip when the encounter is `admission` AND its category is bundled for the encounter's facility.** Chosen over the price-list `isHidden` flag, which can't express the discharge-vs-administered medication split.
- Medications are the special case. `recalculateAndApplyInvoiceQuantity` (`Prescription.ts:214`) sums the **discharge** portion (`PharmacyOrderPrescription.isDischargePrescription`) and the **administered** portion (MAR doses, gated by `INVOICEABLE_MEDICATION_ENCOUNTER_TYPES`). The exclusion zeroes only the **administered** portion for admission encounters; discharge meds always bill.
- No retroactive re-evaluation: each item is decided by its own `afterCreate` hook against the then-current encounter type, so pre-admission outpatient/ER items keep full price automatically — nothing re-runs on type change.

## Build steps

- [ ] Facility setting: bundled-categories list (`settings/src/schema/facility.ts`), e.g. `invoicing.inpatientBundledCategories`
- [ ] Shared check `isCategoryBundledForEncounter(category, encounter)` → `Setting.get(key, encounter facilityId)`, admission-only
- [ ] Lab: gate in `shouldAddLabRequestToInvoice` (`LabRequest/hooks.ts:10`) — skip when bundled + admission
- [ ] Imaging: gate in `shouldAddImagingRequestToInvoice` (`ImagingRequest/hooks.ts:12`) and the area path (`ImagingRequestArea/hooks.ts:85`)
- [ ] Medications: in `recalculateAndApplyInvoiceQuantity`, exclude the administered/MAR sum when meds are bundled + admission; keep the discharge sum (`Prescription.ts:266–314`)
- [ ] Procedures: confirm no change (never bundled) — `Procedure/hooks.ts`
- [ ] Confirm `facilityId` is derivable from the encounter inside the hooks (e.g. `encounter.location.facilityId`)

### Tests

- [ ] Per-state matrix (Chuuk / Kosrae / Pohnpei / Yap) from the inclusion table
- [ ] Admission excludes bundled categories; outpatient/ER still auto-add them
- [ ] Discharge meds always invoiced even when administered meds are bundled
- [ ] Pre-admission item keeps full price after the encounter becomes admission
- [ ] Bundled items are absent from the invoice (not added at all)

## Risks / open

- The lab/imaging hooks currently read **global** settings; this work needs `facilityId` in-hook — verify it's reliably available from the encounter/invoice.
