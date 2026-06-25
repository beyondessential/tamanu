# Tech Design - FSM Encounter Fees

Product decisions and technical design for the FSM Encounter Fee Invoicing.

# Cross Cutting

- **One fee engine.** Outpatient, emergency and bed fees are all invoice products priced through the existing price-list system; they differ only in which product applies and when it's added (encounter start for outpatient/emergency, per night for the bed fee).
- **One pricing mechanism — price lists.** Per-facility, age and patient-type rates, insurance and discounts all come from the existing price-list engine; no new pricing logic. The bed fee joins by treating each bed (Location) as a priceable product.
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

### Walk-in pharmacy vs regular clinic — discriminator flag + charge toggle

Walk-in pharmacy dispensing creates a `clinic` encounter, the same type as a regular clinic visit. Resolved with Les: where pharmacy is charged (Yap) it's the **same fee** as a regular clinic visit; where it isn't (Pohnpei) the fee is **skipped** entirely. No facility prices the two differently. So this is **charge-or-skip, not a pricing difference** — no separate pharmacy fee products (which would mean a parallel, mostly-$0 product set). But the fee logic still has to tell pharmacy walk-ins apart from regular clinic encounters; today's only signal is the hardcoded free-text `reasonForEncounter: 'Medication dispensing'`, too fragile to bill off.

**Approach: an additive discriminator flag on the encounter**, e.g. `isPharmacyEncounter` (boolean, default `false`), set `true` at creation by the walk-in pharmacy route and immutable thereafter; plus a **facility setting** toggling whether pharmacy walk-ins are charged.

- **Fee selection:** for a `clinic` encounter, if `isPharmacyEncounter` is set and the facility's charge-pharmacy setting is off, the helper **skips the fee**; otherwise the pharmacy walk-in gets the **normal clinic fee** — same products, same time-of-day bucket as a regular visit.
- **Why a flag, not a new encounter type:** additive and low-blast-radius (one column + migration), vs a new encounter type which threads through ~61 files (UI, permissions, FHIR, reports, mobile, sync, dbt, auto-discharger, invoiceable-type sets) and changes existing clinic behaviour. A new `pharmacy` encounter type is the cleaner long-term model *if* the org wants pharmacy dispensing to be a first-class encounter concept — that's a separate product decision, out of scope here.
- **Migrations:** the column is on `encounters`, which syncs — so add the **mobile (TypeORM) migration alongside the server (Sequelize) one**, even though walk-in pharmacy is a facility-server flow today.

## Decisions

- Applied **once at encounter start**, amount by start time: standard-hours / after-hours (weekday) / weekend.
- In/after-hours boundary configurable **per facility**
- Per-facility, optionally age-based, insurance-eligible — all via price lists.
- Public holidays not automated — cashier adjusts.
- Includes **A single ED fee** covering Triage, Active ED and Emergency short stay
- **No imaging encounters** in FSM — outpatient fee applies to clinic (incl. walk-in pharmacy) only.
- **Walk-in pharmacy** (clinic) encounters: charged the **normal clinic fee** where the facility charges pharmacy (Yap), **no fee** where it doesn't (Pohnpei) — controlled by a per-facility toggle + the `isPharmacyEncounter` discriminator, not separate products.

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


  
