---
id: FEES
---

# Encounter fees

Facilities charge patients a set of encounter-driven fees: an outpatient or emergency fee at the start of a visit, a bed fee for each qualifying overnight of an admission, and — for admissions — a bundle that folds selected clinical item categories into the inpatient fee instead of billing them separately.

All fees run through one fee engine and one pricing mechanism, so a facility manages a single price list and the same rules for per-facility rate, age band, insurance eligibility and discount apply everywhere. This spec is the product source of truth for how encounter fees are determined, priced and attached to invoices test.

## Shared principles

- [ ] Outpatient, emergency and bed fees are all invoice products priced through the price-list system; they differ only in which product applies and when it is added — the outpatient and emergency fees at encounter start, the bed fee per qualifying night.
- [ ] All rates, age and patient-type variation, insurance eligibility and discounts come from the price-list engine; there is no separate pricing logic for fees.
- [ ] Each bed is a priceable product, so bed rates use the same price-list engine as every other fee.
- [ ] Where a fee needs to vary by department (walk-in pharmacy), a separate fee product carries that variation, so a facility keeps a single price list rather than a department dimension on the engine.
- [ ] Invoicing on/off is a global setting. Per-state behaviour — the outpatient and emergency normal-hours windows, the overnight bed-fee check time, and which item categories are bundled into the inpatient fee — is facility-scoped.
- [ ] The nightly scheduler runs after the overnight bed-fee check time so a night is only charged once the check time has passed.
- [ ] Auto-added fees behave like manual items: a cashier can adjust or remove them (for example on a public holiday). A fee a cashier has removed is not re-added on a later re-run or re-sync.
- [ ] Invoice-item source types include encounter fee and bed fee.

### Encounter-type taxonomy

- [ ] Outpatient covers clinic and imaging encounters.
- [ ] Emergency covers triage, active ED care and emergency short-stay encounters — one emergency family, all charged the ED fee.
- [ ] Inpatient covers admission encounters.
- [ ] Vaccination and form-response encounters carry no encounter fee.

## Outpatient and ED fees

The outpatient and emergency fees are added once, at encounter start, wherever an invoice is created. The fee product is chosen from the encounter family and the time-of-day bucket; the same mechanism serves the emergency fee.

Both an outpatient fee and an emergency fee still apply when a patient is admitted directly to hospital from the encounter.

- [ ] An outpatient fee is applied once at encounter start, its amount chosen by start time: standard-hours, after-hours (weekday) or weekend.
- [ ] Standard hours cover weekday daytime; after-hours covers the remaining weekday hours; the weekend window runs from Friday evening through Monday morning. In states that do not distinguish after-hours from weekend care, the after-hours and weekend fees may resolve to the same product.
- [ ] Time-of-day is computed in facility-local time, so an encounter stored near midnight buckets into the correct window.
- [ ] The in-hours / after-hours boundary is configurable per facility.
- [ ] Three clinic encounter-fee products (standard, after-hours, weekend) are identified by stable codes; the per-facility amount comes from the price list, and fees are optionally age-based and insurance-eligible through it.
- [ ] There is one fee line per encounter, anchored to the encounter, so re-runs and re-syncs update the same line and never duplicate it. The initial fee is set when the invoice is created; an encounter-level change adds the fee only if no line already exists for the same product.
- [ ] Adding the fee at start rather than at discharge means it survives the end-of-day clinic auto-discharge.
- [ ] The emergency (ED) fee covers triage, active ED and emergency short stay, added once at encounter creation. Its amount is bucketed by start time — standard-hours, after-hours (weekday) or weekend — the same way as the outpatient fee.
- [ ] The emergency in-hours window is configured separately from the outpatient window (defaulting to the same hours), so a state can run different ED in-hours; the weekend window likewise runs from the emergency window's Friday close to its Monday open.
- [ ] Three emergency encounter-fee products (standard, after-hours, weekend) are identified by stable codes and priced per facility on the price list; a state that doesn't distinguish weekend ED care can leave the weekend product unpriced and it falls back to the after-hours ED product.
- [ ] A patient admitted directly from ED keeps the ED encounter fee, which was added at triage creation and is not removed by the encounter-type change.
- [ ] Public holidays are not automated; a cashier adjusts the fee where required.

### Walk-in pharmacy fee

Walk-in pharmacy dispensing creates a clinic encounter — the same type as a regular clinic visit — but in a dedicated department, distinct from regular clinic departments. The encounter's department is therefore what distinguishes a clinic fee from a pharmacy fee.

- [ ] Clinic encounter fees (standard, after-hours, weekend, emergency) are selected by encounter family and facility-local time-of-day.
- [ ] A single flat pharmacy encounter-fee product is charged for an encounter created in the configured pharmacy department.
- [ ] When adding the fee, the encounter's department is compared to the configured pharmacy department: a match resolves the pharmacy product, otherwise the clinic selector runs.
- [ ] Both the clinic and pharmacy products live on the one facility price list; there is no department-scoped list and no department dimension on the price-list engine.
- [ ] Charging pharmacy is opt-in: where the pharmacy product is priced a flat pharmacy fee line is added; where it is left unpriced no fee line is added.
- [ ] Clinic and ED fees are opt-out: a product that is present but unpriced still surfaces as a $0 line so misconfiguration stays visible, and a facility suppresses the fee by hiding the product. Unpriced and hidden are distinct states — unpriced gives a $0 line, hidden gives no line. See `configuration-guide.md` for how products, prices and the hidden state are set up.

## Inpatient bed fee

A nightly scheduled job charges each qualifying night for currently-admitted patients; the first night is added on admission. The rate for a night is the patient's location at the overnight check, priced through the price list.

- [ ] Each bed is a priceable product in a bed-fee category, so bed rates use the price-list engine rather than a price field on the location. Pricing is per location, because beds within a location group can differ in rate.
- [ ] A bed fee is charged once per qualifying overnight: the first night on admission (a minimum of one night, covering same-day admit, death, abscond or leaving against medical advice), and each later night at the overnight check time if the patient is still admitted.
- [ ] The rate is set by the patient's location at the overnight check.
- [ ] Before the first overnight check, the minimum-one-night follows the patient's current location, so an early ward move updates its attribution immediately.
- [ ] Only a location with a bed-fee product is charged; placeholder "open ward" locations have no product and so carry no bed fee.
- [ ] The invoice batches bed fees by location (for example ICU ×2, Ward 1 Bed 1 ×3) rather than one row per night; nightly charging recomputes the batched quantity rather than incrementing it.
- [ ] The location for a past night is determined from the location change history, so it is resolvable at a time other than when the nightly job runs.
- [ ] The overnight check time is configurable per facility and evaluated in facility-local time.
- [ ] A patient admitted from ED keeps the ED encounter fee and is also charged the bed fee's first night, with pre-admission items at full price, all on the one encounter invoice.

## Inpatient fee inclusions and exclusions

For an admission, a facility can bundle selected clinical item categories into the inpatient fee instead of billing them separately. A single facility setting lists the bundled categories, checked only for admission encounters. Outpatient and emergency encounters always invoice every category.

- [ ] The bundled-category list is a single facility setting, controlling inclusion per category, per facility.
- [ ] Where the admission fee bundles a category, items in that category do not auto-add for inpatients but still auto-add for outpatient and emergency encounters.
- [ ] The exclusion applies only to the administered portion of medications; discharge medications are billed separately.
- [ ] Pre-admission items keep their full price and are not retro-bundled on admission; existing items are not re-evaluated when the encounter type changes.
- [ ] Procedures always invoice separately, in every state.
- [ ] Items bundled into the inpatient fee are absorbed into it rather than appearing as separate invoice lines.

### Inclusion table

Yes = the category is bundled into the inpatient fee for that state.

| Item        | Chuuk | Kosrae | Pohnpei | Yap |
| ----------- | ----- | ------ | ------- | --- |
| Imaging     | no    | no     | no      | yes |
| Lab         | no    | no     | no      | yes |
| Medications | no    | yes    | no      | yes |
| Procedures  | no    | no     | no      | no  |
