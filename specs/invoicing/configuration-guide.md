Configuration guide for the FSM auto-invoicing features: outpatient & ED encounter fees, the inpatient bed fee, and inpatient fee inclusions/exclusions. It's written for the person setting up a facility — it explains what to configure and how, not how the code works.

All amounts come from **price lists**, so there's one pricing mechanism to learn. Reference data and price lists are set up through the **reference data import spreadsheet**, downloaded from and uploaded to your Tamanu system.

---

# 1. Enable invoicing

Invoicing is off by default. Turn it on for the deployment with the global setting:

- `features.invoicing.enabled` → `true`

With it off, no invoices or fees are created and the rest of this guide has no effect.

---

# 2. How pricing works (read this first)

Every chargeable thing — a procedure, a lab test, an encounter fee, a bed — is an **Invoice Product**. A **Price List** sets the amount for each product, and a price list applies to an encounter when its **rules** match. Rules can match on:

- **Facility**
- **Patient type** (billing type)
- **Patient age**

A rule that's left blank matches everything, so a facility-wide price list (only the facility rule set) covers every encounter at that facility, and a more specific price list (e.g. facility + patient type) takes precedence where it matches. When two price lists could match, the one with the lower **evaluation order** wins.

Price lists are filled in as a **matrix** on the price-list-item tab: the first column is `invoiceProductId` (the product codes, one per row) and each remaining column header is a **price list code**. In each cell you put either:

- a **number** — the price of that product on that price list, or
- **`hidden`** — that product is **not charged** on that price list (no line appears on the invoice).

`hidden` is the key to "don't charge this product here".

---

# 3. Outpatient & ED encounter fees

A fee is added automatically when an encounter starts. Both outpatient and ED fees are chosen by **encounter type and start time**:

| Fee | Applies to | Reference-data code |
| --- | --- | --- |
| Standard hours | Outpatient (clinic), weekday in-hours | `encounterFeeStandard` |
| After hours | Outpatient, weekday out-of-hours | `encounterFeeAfterHours` |
| Weekend | Outpatient, weekend | `encounterFeeWeekend` |
| ED standard hours | Emergency (triage / active ED / short stay), weekday in-hours | `encounterFeeEmergencyStandard` |
| ED after hours | Emergency, weekday out-of-hours | `encounterFeeEmergencyAfterHours` |
| ED weekend | Emergency, weekend | `encounterFeeEmergencyWeekend` |

### Set up the fee products

Add rows to the **`encounterFee`** reference-data tab using the six codes above (and a display name). Importing them creates the matching Invoice Products. Then price each one per facility on the price-list-item matrix.

You don't have to run a separate weekend fee — for either outpatient or ED, if you only price the standard and after-hours codes, weekend encounters fall back to the after-hours fee. Add the weekend code only where a state wants a distinct weekend rate.

### Set the in-hours windows

Outpatient and ED each have their own weekday standard-hours window (per-facility, 24-hour, facility-local time). They default to the same hours:

- `invoicing.encounterFee.standardHoursStart` / `standardHoursEnd` — outpatient (defaults `08:00` / `17:00`)
- `invoicing.encounterFee.emergencyStandardHoursStart` / `emergencyStandardHoursEnd` — emergency/ED (defaults `08:00` / `17:00`)

Encounters starting outside their window on a weekday get the after-hours fee; each weekend runs from that window's Friday close to Monday open. Set the ED window differently from the outpatient window where a state runs different ED in-hours. Public holidays aren't automated — a cashier adjusts those.

### Walk-in pharmacy (charging some facilities, not others)

A walk-in pharmacy dispensing visit is a clinic encounter created in a **dedicated pharmacy department** (set by `medications.medicationDispensing.automaticEncounterDepartmentId`). It's charged a **separate, flat pharmacy fee** rather than a clinic fee — so whether pharmacy is charged is just a matter of whether you price that product, all on the one facility price list:

- **Set up the product:** add a row to the **`pharmacyEncounterFee`** reference-data tab with the code `encounterFeePharmacy` (and a display name). Importing it creates the matching Invoice Product.
- **To charge pharmacy** (e.g. Yap): give `encounterFeePharmacy` a price on the facility price list → each pharmacy visit gets that flat fee.
- **To not charge pharmacy** (e.g. Pohnpei): leave `encounterFeePharmacy` off the price list (or unpriced). Charging pharmacy is opt-in, so with no price there's simply no fee line — no separate department price list needed.

Regular clinic visits in other departments are charged the clinic fees above, regardless.

The same approach lets any department carry its own encounter-fee rate, or none.

---

# 4. Inpatient bed fee

Admitted patients are charged a per-night bed fee: the first night on admission, then one night per overnight check while still admitted.

- **Each chargeable bed/ward is an Invoice Product** in the **Bed fee** category, pointing at that Location. Create one per chargeable Location and price it per facility on the price-list matrix. Different beds/wards can have different rates.
- **"Open ward" placeholder locations** are simply left without a bed-fee product — locations with no product are never charged.
- The nightly check time is a per-facility setting (facility-local): `invoicing.bedFee.overnightChargeTime` (default `02:00`).
- The invoice shows **one line per location** with the number of nights as the quantity (e.g. ICU ×2, Ward 1 Bed 1 ×3). The rate for each night follows the location the patient occupied at the overnight check.

A patient admitted from ED keeps the ED encounter fee and is also charged the first bed-fee night on the same invoice.

---

# 5. Inpatient fee inclusions / exclusions

In some states the admission fee already covers medications, imaging and/or lab requests, so those shouldn't also be itemised on an admission invoice. This is controlled per facility:

- `invoicing.inpatientAutoInvoicingExclusions` — a list of the categories bundled into the admission fee. Allowed values: `imaging`, `lab`, `medication`.

Behaviour:

- For **admission** encounters at the facility, a bundled category's items **don't auto-add** to the invoice (they're covered by the admission fee and aren't shown).
- For **outpatient/ER** encounters, those items are still added in full — bundling only applies to admissions.
- **Procedures are never bundled.**
- For medications, only the **administered** (drug chart) portion is excluded; **discharge** dispensing is always invoiced.
- Items added before admission keep their full price — they aren't retro-bundled when the patient is admitted.

### Inclusion table by state

| Item | Chuuk | Kosrae | Pohnpei | Yap |
| --- | --- | --- | --- | --- |
| Imaging | no | no | no | yes |
| Lab | no | no | no | yes |
| Medications | no | yes | no | yes |
| Procedures | no | no | no | no |

So Kosrae sets `invoicing.inpatientAutoInvoicingExclusions` to `["medication"]`, Yap to `["imaging","lab","medication"]`, and Chuuk/Pohnpei leave it empty.
