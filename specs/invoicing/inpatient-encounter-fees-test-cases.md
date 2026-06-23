# Inpatient Bed Fee — Test Cases (TAM-6900)

Scenarios that verify the per-night bed fee: admission night, multi-night accrual, per-location rate and batching, exclusions, and the nightly job. Pairs with `inpatient-encounter-fees-plan.md`.

**Setup:** an admission encounter; locations configured as bed-fee products priced in a matching price list; the overnight check time set (e.g. 02:00) facility-local; an "open ward" placeholder location.

## Admission night

- [ ] Admit a patient → one bed-fee line for the admission location, quantity **1**, at that location's rate
- [ ] Same-day admit then discharge / death / abscond / LAMA before the next check → still exactly **1** night charged

## Multi-night accrual

- [ ] Patient still admitted past the 02:00 check → quantity becomes **2** at that check, **3** the following night, and so on
- [ ] Nightly job run several times within one window → quantity is **stable** (recompute sets, never increments)
- [ ] Discharged patient is not charged for nights after discharge

## Location attribution & batching

- [ ] Patient in ICU 2 nights then Ward 1 Bed 1 for 3 nights → **two** lines: ICU qty 2, Ward 1 Bed 1 qty 3
- [ ] Patient changes location mid-day → the night is attributed to the location occupied **at the 02:00 check** (via `EncounterHistory`)
- [ ] Bed-fee rate matches the configured price-list item for that location (per-facility / age via the price list)

## Exclusions

- [ ] Patient in an "open ward" placeholder location → **no** bed-fee line for that location

## Nightly job

- [ ] Job charges **only currently-admitted** patients at the facility-local check time
- [ ] A facility in a different timezone is processed at **its own** local check time, not the primary-TZ time
- [ ] A large set of admitted patients is processed in batches without error
