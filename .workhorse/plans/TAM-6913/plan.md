# Ward-price scenario (TAM-6913)

Refine the bed-fee night counting so that when a patient occupies more than one billable location in a single night window — e.g. placed in a general ward while waiting for a private room, then moved once one frees up — each distinct billable location occupied counts as one night.

Implements the ward-price scenario section of `spec: FEES`. Builds directly on TAM-6900's bed fee; a tail task that depends on it landing.

## Technical approach

- Builds on 6900's `recalculateBedFee`. Change the per-night attribution from "the location at the check instant" to "**each distinct billable location occupied during the night window**", taken from `EncounterHistory`, deduped, placeholders excluded, one night each.
- Everything else (recompute = set, batching by location, the nightly job) is inherited from 6900 unchanged.

## Build steps

- [ ] Extend the night-counting in `recalculateBedFee` to enumerate the distinct billable locations occupied within each night window (`EncounterHistory`), not just the check-instant location
- [ ] Dedupe per window; exclude placeholder locations; one night per distinct location
- [ ] Tests: ward → private same day = 1 night each (2 lines); no double-count when the patient stays put; correct interaction with multi-night accrual

## Risks / open

- The "night window" boundary (when a billing day starts for this rule) must align with 6900's overnight check time — confirm the window definition with the team before implementing.
