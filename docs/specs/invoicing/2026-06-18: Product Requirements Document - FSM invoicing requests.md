# Auto Addition of Encounter Fees PRD

Auto addition of encounter fees to an invoice.

## Encounter fee business rules for FSM

- Encounter fees are to be set per facility
  - And by day of week and time for outpatient fees. I.e. define 'in' and 'out' of hours fees. 
  - Inpatient fees are set by location as room rates can differ. 
- Each facility may apply an age based encounter fee
- Encounter fee may have insurance coverage
- Public holidays do not need to be applied automatically

------

## Outpatient Fees

Fee A - Standard Hours

- **Encounter type:** Outpatient
- **Applicable hours:** 08:00 - 17:00
- **Applicable days:** Monday - Friday (Excludes public holidays however we won't worry about this for initial implementation. Cashier can adjust fees where required.)
- **Trigger:** Applied once at encounter start
  - *Example: Encounter starts 16:30 Thursday, ends 19:00 Thursday → Fee A applies*

Fee B - After Hours (Weekday)

- **Encounter type:** Outpatient
- **Applicable hours:** 17:01 - 07:59
- **Applicable days:** Monday - Friday
- **Trigger:** Applied once at encounter start

Fee C — Weekend

- **Encounter type:** Outpatient
- **Applicable window:** Friday 17:01 through Monday 07:59
- **Trigger:** Applied once at encounter start

**Note:** In FSM B and C are the same fee, though would be nice to allow config to distinguish between after-hours and weekend care. 

------

## Emergency Fees

Fee Y - Triage, Active ED & Emergency short stay

- **Encounter type:** Triage, Active ED or Emergency short stay
- **Trigger:** Applied once on triage encounter creation.

*Simplified after discussion with Les — replaces the earlier separate Fee Y (on discharge) and Fee Z (on escalation).*

**Note:** Both outpatient and emergency fees still apply if patient is directly admitted to hospital form the encounter. 

------

## *Inpatient Fees*

Fee X — Overnight Stay

- **Encounter type:** Inpatient
- **Trigger:** Charged once per qualifying overnight. 
  - Night 1 should be charged on admission. 
  - Night 2 onwards should be assessed at a fixed time overnight, e.g. 2am. 
    - E.g. If patient is admitted on June 16th and has a 3 night stay. Night 1 will be charged at time of admission, night 2 will be charged at 2am on June 18th, and night 3 will be charged at 2am on June 19th. 
- **Fee amount:** Determined by the patient's **assigned location at the time of the overnight check**. Each location has an individually configured fee rate.
  - If patient changes location multiple times in a single day, the location fee applied should be based on the location at the time of the overnight inpatient check.
    - There is an exclusion to this: 
      - A patient can be admitted to a private ward based on a doctor's order or their own request. If a private room is unavailable at the time of admission/request, the patient is placed in a general ward temporarily. Once a private room becomes available, the patient is moved. In this scenario, the patient is billed for **both** the general ward and the private ward separately.
        - E.g. request is made to move to private room at 8am however bed is not currently available so patient is admitted to general ward. At 5pm, bed becomes available and patient is transferred. At 2am the next day, patient is billed for 1 night in general ward and 1 night in private ward.
  - Fee X stops if a patient turns 65 during their inpatient stay. I.e. patient will be charged only up until the day prior to their 65th birthday. 
- **Invoicing:**
  - Batch invoice line items by location: 
    - E.g. If a patient is in ICU for 2 nights and then transferred to Ward 1 Bed 1 for 3 nights, invoice should display 1 item with quantity of 2 for ICU and 1 item with quanitity of 3 for Ward 1 Bed 1.

------

## Additional considerations:

- In some FSM states, the hospital admission fee includes the cost of medications, imaging and lab requests. We therefore need a way to exclude these invoice items from autoadding to the invoice in these scenarios. 
  - These items still need to be added to an invoice for an outpatient or emergency patient. 
- Items included as part of the inpatient fee by state:

| **Item**    | **Chuuk** | **Kosrae** | **Pohnpei** | **Yap** |
| ----------- | --------- | ---------- | ----------- | ------- |
| Imaging     | no        | no         | no          | yes     |
| Lab         | no        | no         | no          | yes     |
| Medications | no        | yes        | no          | yes     |
| Procedures  | no        | no         | no          | no      |

- Items that are added before admit to hospital i.e. outpatient or ER, should be treated per Outpatient/ER rules (ie they do not become part of inpatient inclusions and are displayed in invoices in full details as per Outpatient).
- Items that are included as part of inpatient fees do not need to be shown on the invoice.
- Require flexibility in selecting individual categories of product items - e.g. only drugs are included in inpatient fee in Korsae, labs and imaging are not. 
- STAT meds for outpatients - decision to be made about whether we support allowing a STAT medication recorded on MAR trigger the addition of that medication to an invoice for an outpatient. 

------

### Tamanu consideration

- No charge required for vaccination or form response encounter types. Though good to consider these as part of any encounter fee configuration for future proofing. 

