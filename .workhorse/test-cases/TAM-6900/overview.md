# Inpatient bed fee — test cases (TAM-6900)

Scenarios that verify the per-night bed fee: admission night, multi-night accrual, per-location rate and batching, exclusions, and the nightly job.

**Setup:** an admission encounter; locations configured as bed-fee products priced in a matching price list; the overnight check time set (e.g. 02:00) facility-local; an "open ward" placeholder location left without a product. Manual scenarios below were exercised at facility-1 (Ward 1 Bed 1 $200, Ward 2 Bed 1 $300; ED beds left unpriced as placeholders).

## Admission night

- [x] Admit a patient; confirm one bed-fee line for the admission location, quantity **1**, at that location's rate (verifies spec: FEES)
- [ ] Same-day admit then discharge / death / abscond / LAMA before the next check; confirm still exactly **1** night charged (verifies spec: FEES)

## Multi-night accrual

- [ ] Patient still admitted past the 02:00 check; confirm quantity becomes **2** at that check, **3** the following night, and so on (verifies spec: FEES)
- [ ] Run the nightly job several times within one window; confirm quantity is **stable** (recompute sets, never increments) (verifies spec: FEES)
- [ ] Discharge a patient; confirm they are not charged for nights after discharge (verifies spec: FEES)

## Location attribution & batching

- [ ] Move a patient ICU 2 nights then Ward 1 Bed 1 for 3 nights; confirm **two** lines: ICU qty 2, Ward 1 Bed 1 qty 3 (verifies spec: FEES)
- [ ] Change a patient's location mid-day; confirm the night is attributed to the location occupied **at the 02:00 check** (verifies spec: FEES)
- [ ] Confirm the bed-fee rate matches the configured price-list item for that location (per-facility / age via the price list) (verifies spec: FEES)
- [ ] Confirm the bed-fee line resolves its Location source so its product code renders in invoice views / PDF

## Exclusions

- [x] Place a patient in an "open ward" placeholder location; confirm **no** bed-fee line for that location (verifies spec: FEES)

## Combined with ED

- [ ] Admit a patient directly from ED; confirm the ED fee **and** the first bed-fee night appear on one invoice, with pre-admission items at full price (verifies spec: FEES)

## Nightly job

- [ ] Confirm the job charges **only currently-admitted** patients at the facility-local check time (verifies spec: FEES)
- [ ] Confirm a facility in a different timezone is processed at **its own** local check time, not the primary-TZ time (verifies spec: FEES)
- [ ] Confirm a large set of admitted patients is processed in batches without error
