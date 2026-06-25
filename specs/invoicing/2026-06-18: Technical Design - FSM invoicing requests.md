# Tech Design - FSM Encounter Fees

Product decisions and technical design for the FSM Encounter Fee Invoicing.

# Cross Cutting

- **One fee engine.** Outpatient, emergency and bed fees are all invoice products priced through the existing price-list system; they differ only in which product applies and when it's added (encounter start for outpatient/emergency, per night for the bed fee).
- **One pricing mechanism — price lists.** Per-facility, per-department, age and patient-type rates, insurance and discounts all come from the existing price-list engine; no new pricing logic. The bed fee joins by treating each bed (Location) as a priceable product.
- **Settings.** Invoicing on/off stays global; a new **facility-scoped** block holds the per-state behaviour (states differ): normal-hours window, overnight bed-fee check time (default 02:00), and which item categories are bundled into the inpatient fee. (need to make sure that the scheduler runs after the bed fee check time each night)
- **Encounter-type taxonomy.** 
  - Outpatient: clinic, imaging
  - Emergency: triage, emergency, observation
  - Inpatient: admission

- **Cashier-editable.** Auto-added fees behave like manual items (cashiers can adjust/remove, e.g. public holidays); Note that a removed fee must not be re-added.

---



# Outpatient & ED Encounter Fees (TAM-6898)

## Tech design

- A shared helper (run wherever an invoice is created) picks the fee product from the encounter family + time-of-day bucket and adds it; the same helper serves the emergency fee.
- **Time-of-day must be computed in facility-local time** — stored times are in the server's primary timezone, so a near-midnight encounter buckets wrong otherwise.
- Three encounter-fee products (standard/after-hours/weekend) identified by stable codes; the **per-facility amount** comes from the price list.
- **One fee line per encounter** — anchored to the encounter, so re-runs/re-syncs update the same line, never duplicate. Adding at start (not discharge) survives the end-of-day clinic auto-discharge. Changes should be handled through an Encounter model level change hook - this should only add if there isn't already a line for the same product code. Initial encounter fee is set when the invoice is created.
- Update the invoice-item "source" types with 2 new types: Encounter Fee and Bed Fee.

### Walk-in pharmacy vs regular clinic — fee varies by Department

Walk-in pharmacy dispensing creates a `clinic` encounter, the same type as a regular clinic visit — but in a **dedicated department** (`medications.medicationDispensing.automaticEncounterDepartmentId`), distinct from regular clinic departments. So **Department is the natural discriminator** and no extra flag on the encounter is needed. Resolved with Les: where pharmacy is charged (Yap) it's the same fee as a regular clinic visit; where it isn't (Pohnpei) it's skipped. No facility prices the two differently.

**Approach: the encounter fee varies by Department, through the price-list engine.** Add `departmentId` as a price-list rule dimension (alongside facility / patient type / age):

- **Charge (Yap):** the pharmacy department's price list prices the encounter-fee product like a normal clinic visit.
- **Skip (Pohnpei):** the pharmacy department's price list **hides** the encounter-fee product (the existing `isHidden` mechanism) → no fee line (not a $0 line).
- **Fee selection is unchanged** — the helper still picks the standard / after-hours / weekend / ED product by encounter family + time-of-day. Department only affects which price list matches: the amount, or hidden → skip.
- **Requires** the encounter-fee add path to honour the matching price list's `isHidden`/absence — the same check the other auto-add paths already make — so a department can skip the fee.
- **No `isPharmacyEncounter` flag, column or migration** — the department already on every encounter does the job.

This keeps all pricing in the price-list engine (per the Cross-Cutting "one pricing mechanism" principle) and is **future-proof**: any department can carry its own encounter fee, or none — not just pharmacy. It assumes the pharmacy auto-department is distinct from regular clinic departments (true by config).

*(Superseded: the first cut of TAM-6898 used an `isPharmacyEncounter` boolean on the encounter + a per-facility charge toggle. Replaced by the department model above, which avoids a synced column + mobile migration and generalises beyond pharmacy.)*

## Decisions

- Applied **once at encounter start**, amount by start time: standard-hours / after-hours (weekday) / weekend.
- In/after-hours boundary configurable **per facility**
- Per-facility, optionally age-based, insurance-eligible — all via price lists.
- Public holidays not automated — cashier adjusts.
- Includes **A single ED fee** covering Triage, Active ED and Emergency short stay
- **No imaging encounters** in FSM — outpatient fee applies to clinic (incl. walk-in pharmacy) only.
- **Walk-in pharmacy** (clinic) encounters: the encounter fee varies by **Department** via the price list — priced normally where pharmacy is charged (Yap), hidden (no line) where it isn't (Pohnpei). No separate products, no encounter flag.

---



# Inpatient Encounter Fees (TAM-6900)

## Tech design

- **Each Location (bed) is a priceable product** (new "bed fee" category), so bed rates use the price-list engine. Chosen over a price field on the Location, using price-list rules. *(Location Group was considered but Les confirmed beds within a group can differ in rate, so pricing is per Location.)*
- **Nightly job** (existing scheduled-job pattern) charges each night for currently-admitted patients; the first night is added on admission.
- **65+** is a single age check — Not a requirement any more
- **Batching — recompute, don't increment.**
- Use logs.changes  to get the Location as it needs to be determinable at a different time to the nightly fee charging job. 

## Decisions

- Charged **once per qualifying overnight**: first night on admission (minimum one night, covering same-day admit / death / abscond / LAMA); each later night at a fixed overnight time if still admitted.
- Rate set by the patient's **Location at the overnight check** (each bed/ward has its own rate, via price lists).
- Mid-stay-birthday edge case is out of scope, so age is checked once for the stay.
- **"Open ward" placeholder** locations are never charged.
- Invoice **batches by Location** (e.g. ICU ×2, Ward 1 Bed 1 ×3), not one row per night.
- Overnight check time configurable per facility (default 02:00), in facility-local time.
- A patient **admitted from ED** keeps the ED encounter fee and is also charged the bed fee's first night, with pre-admission items at full price — all on the one encounter invoice.



# FSM Price Ward Scenario (TAM-6913)

Handles the edge case where a patient occupies two billable locations in one day — placed in a general ward while waiting for a private room, then moved once one frees up — and is billed a night for each (a distinct billable location occupied that day = one night).

---



# Inpatient fee inclusions / exclusions (TAM-6901)

## Tech design

- **A single facility setting** lists the categories bundled for inpatients; each clinical-item auto-add path checks it, only for admission encounters. (Outpatient/ER always invoice everything, so no per-encounter-type matrix is needed.) Chosen over the price-list "hidden" flag, which can't express the discharge-vs-administered medication split.
- Discharge vs administered meds: apply the exclusion to the administered portion only.
- Pre-admission items persist automatically — existing items aren't re-evaluated when the encounter type changes.

## Decisions

- Where the admission fee bundles items, those categories **don't auto-add** for inpatients but still do for outpatient/ER. Control is **per category, per facility**.
- Pre-admission items keep full price** — not retro-bundled on admission.
- **Procedures are never bundled** in any state
- Items that are included as part of inpatient fees do not need to be shown on the invoice
- **STAT medications for outpatients: out of scope** (confirmed).

#### Inclusion table (yes = bundled into the inpatient fee)

| Item | Chuuk | Kosrae | Pohnpei | Yap |
| --- | --- | --- | --- | --- |
| Imaging | no | no | no | yes |
| Lab | no | no | no | yes |
| Medications | no | yes | no | yes |
| Procedures | no | no | no | no |


  
