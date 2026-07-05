# Inpatient bed fee — test cases (TAM-6900)

Scenarios that verify the per-night bed fee: admission night, multi-night accrual, per-location rate and batching, exclusions, and the nightly job.

**Setup:** an admission encounter; locations configured as bed-fee products priced in a matching price list; the overnight check time set (e.g. 02:00) facility-local; an "open ward" placeholder location left without a product. Manual scenarios below were exercised at facility-1 (Ward 1 Bed 1 $200, Ward 2 Bed 1 $300; ED beds left unpriced as placeholders).

## Admission night

- [x] Admit a patient; confirm one bed-fee line for the admission location, quantity **1**, at that location's rate (verifies spec: FEES)
- [ ] Same-day admit then discharge / death / abscond / LAMA before the next overnight check; confirm still exactly **1** night charged (the minimum one admission night) (verifies spec: FEES)
- [ ] Admit a patient in the early hours before the overnight check time (e.g. 01:00 with a 02:00 check); confirm the same-day 02:00 check charges the night they were admitted in (verifies spec: FEES)

## Multi-night accrual

- [ ] Patient still admitted past the 02:00 check; confirm quantity becomes **2** at that check, **3** the following night, and so on (verifies spec: FEES)
- [ ] Recompute the bed fee several times within one window (re-run the recompute / nightly job); confirm quantity is **stable** (recompute sets, never increments) (verifies spec: FEES)
- [ ] Re-sync an admission encounter after a recompute; confirm the batched quantity is unchanged and no duplicate line appears (verifies spec: FEES)
- [ ] Discharge a patient; confirm they are not charged for nights after discharge (verifies spec: FEES)

## Location attribution & batching

- [ ] Move a patient ICU 2 nights then Ward 1 Bed 1 for 3 nights; confirm **two** lines: ICU qty 2, Ward 1 Bed 1 qty 3 (batched by location, not one row per night) (verifies spec: FEES)
- [ ] Change a patient's location mid-day; confirm the night is attributed to the location occupied **at the 02:00 check**, resolved from the location change history (verifies spec: FEES)
- [ ] Admit a patient to priced location A, move them to priced location B, and keep them admitted through the next overnight check; confirm the first night is charged to (and priced at) B — the location occupied at the check — and A is not charged (verifies spec: FEES)
- [ ] Admit a patient to location A and move them to priced location B before any overnight check; confirm the provisional minimum-one-night immediately follows the current location — charged to B, not A, even before the first check (verifies spec: FEES)
- [ ] Move a patient out of a location so it no longer qualifies on recompute; confirm the stale bed-fee line for the vacated location is removed (verifies spec: FEES)
- [ ] Confirm the bed-fee rate matches the configured price-list item for that location — beds are priceable products and rate is per location (verifies spec: FEES)
- [ ] Confirm the bed-fee line resolves its Location source so its product code renders in invoice views / PDF

## Cashier editing

- [ ] Remove a bed-fee line as a cashier (soft-delete), then re-run the recompute / nightly job; confirm it is not resurrected (verifies spec: FEES)

## Exclusions

- [x] Place a patient in an "open ward" placeholder location; confirm **no** bed-fee line for that location (verifies spec: FEES)
- [ ] Admit a patient to an "open ward" placeholder (no bed-fee product, so no fee), move them to a priced location, and keep them admitted through the next overnight check; confirm a bed-fee line for the priced location is charged from that check onward (moving from an unpriced to a priced location starts charging) (verifies spec: FEES)

## Combined with ED

- [ ] Admit a patient directly from ED; confirm the ED fee **and** the first bed-fee night appear on one invoice, with pre-admission items at full price (verifies spec: FEES)

## Nightly job

- [ ] Admit one patient and leave another discharged; run the BedFeeCharger and confirm only the still-admitted patient's fee is (re)charged (recently-discharged within ~25h are still recomputed so the discharge-day night lands) (verifies spec: FEES)
- [ ] With two facilities in different timezones both holding admitted patients, run the job and confirm each facility's nights land at **its own** local overnight-check time, not the primary-TZ time (verifies spec: FEES)
- [ ] With more admitted patients than `batchSize`, run the job and confirm all are processed across multiple batches without error (verifies spec: FEES)
- [ ] Run the job with `batchSize` / `batchSleepAsyncDurationInMilliseconds` unset in config; confirm it raises an InvalidConfigError rather than silently doing nothing
