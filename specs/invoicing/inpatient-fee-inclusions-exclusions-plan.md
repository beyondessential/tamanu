# Inpatient Fee Inclusions / Exclusions — Implementation Plan (TAM-6901)

Per-facility control of which item categories (imaging / lab / medications) are bundled into the admission fee and therefore **don't** auto-add for admission encounters — while still auto-adding for outpatient/ER. Discharge meds are always invoiced; procedures are never bundled; pre-admission items keep full price. Needs the facility-settings block from the foundation but is otherwise independent of the fee products — see `fee-engine-build-order.md`.

## Technical approach

- One facility-scoped setting lists the bundled categories. Each clinical-item auto-add path gains a guard: **skip when the encounter is `admission` AND its category is bundled for the encounter's facility.** Chosen over the price-list `isHidden` flag, which can't express the discharge-vs-administered medication split.
- Medications are the special case. `recalculateAndApplyInvoiceQuantity` (`Prescription.ts:214`) sums the **discharge** portion (`PharmacyOrderPrescription.isDischargePrescription`) and the **administered** portion (MAR doses, gated by `INVOICEABLE_MEDICATION_ENCOUNTER_TYPES`). The exclusion zeroes only the **administered** portion for admission encounters; discharge meds always bill.
- No retroactive re-evaluation: each item is decided by its own `afterCreate` hook against the then-current encounter type, so pre-admission outpatient/ER items keep full price automatically — nothing re-runs on type change.

## Build steps

- [x] Facility setting: bundled-categories list — `invoicing.inpatientFee.bundledCategories` (array of `imaging` / `lab` / `medication`), `settings/src/schema/facility.ts`
- [x] Shared check `isInpatientFeeBundled(models, encounterId, category)` → admission-only, reads `Setting.get(key, facilityId)` (`database/src/utils/isInpatientFeeBundled.ts`)
- [x] Lab: gated in `shouldAddLabRequestToInvoice` — skip when bundled + admission
- [x] Imaging: gated in `shouldAddImagingRequestToInvoice` (the area path defers to it via `ImagingRequestArea/hooks.ts:85`, so it's covered)
- [x] Medications: in `recalculateAndApplyInvoiceQuantity`, the administered (MAR) portion is zeroed when meds are bundled + admission; the discharge sum still bills
- [x] Procedures: no change (never bundled) — `Procedure/hooks.ts` untouched
- [x] `facilityId` derived in the helper from the encounter's location (`encounter.locationId → Location.facilityId`)

### Tests

- [ ] Per-state matrix (Chuuk / Kosrae / Pohnpei / Yap) from the inclusion table — integration
- [ ] Admission excludes bundled categories; outpatient/ER still auto-add them — integration
- [ ] Discharge meds always invoiced even when administered meds are bundled — integration
- [ ] Pre-admission item keeps full price after the encounter becomes admission — integration
- [ ] Bundled items are absent from the invoice (not added at all) — integration

## Implementation status — 2026-06-25

Branch `feature/tam-6901-…`, stacked on `feature/tam-6898` (it reuses 6898's `invoicing` settings block). One commit.

**Done & verified** — `@tamanu/database` + `@tamanu/settings` build pass, lint clean:
- `INPATIENT_BUNDLED_CATEGORIES` constant + the `invoicing.inpatientFee.bundledCategories` facility setting.
- `isInpatientFeeBundled` helper (admission-only, per-facility) and the three gates (lab, imaging, administered-medication).
- Procedures untouched; discharge meds still bill; outpatient/ER unaffected (helper short-circuits on non-admission).

**Not yet runtime/DB-verified** — endpoint/integration tests (the per-state matrix above) haven't been run against a live DB.

**Note:** the helper does small extra PK lookups (re-fetches encounter type/location + facility) per gated request; fine functionally, could be optimised later by threading the already-loaded encounter through.
