# Palau invoicing reqs

## Overview

Belau National Hospital (BNH) bills each patient through one payment pathway: NHI, private insurance, a patient-type discount, workers comp, or non-chargeable. Each pathway has its own rules per item category, and the pathway is often chosen at the cashier. Tamanu prices an invoice with three separate tools (one price list per encounter, one discount percentage on every line, a fixed insurance coverage percentage per product), so it can't produce a BNH bill. This project makes the payment pathway drive the calculation, and fills the medication, payment and reporting gaps around it.

Source: the gap analysis on card N11. Linear parent: TAM-6908.

Each piece of work below lists the **existing functionality** in Tamanu, then the **requirements** BNH needs on top of it. The gap is the difference between the two.

---

## Scope

- **Generic, configured per site**
  - Time-bound patient statuses
  - A payment pathway on the invoice, one per bill
  - Discount category exclusions
  - Minimum charge per product
  - Splitting an invoice between payers
  - Medication block pricing, as a charging type alongside fixed price
- **Palau-specific**
  - NHI rates and co-payment rules
  - MSA payment fields and pending status
  - The BNH patient-type list and its precedence rules
- **Out of scope**
  - FHU (public health)
  - NCD clinic labs (moving to eCW)
  - Ambulance

---

## Summary of work

Priorities to be added. The number is the order of work within the phase.

| # | Piece of work | Phase | Scope | Linear | Priority |
|---|---------------|-------|-------|--------|----------|
| 1.1 | Patient billing profile | 1 | Generic | | TBC |
| 1.2 | Time-bound patient statuses | 1 | Generic | | TBC |
| 1.3 | Payment pathway on the invoice | 1 | Generic | | TBC |
| 1.4 | BNH patient types and precedence | 1 | Palau | | TBC |
| 2.1 | Discount category exclusions | 1 | Generic | | TBC |
| 2.2 | Minimum charge per product | 1 | Generic | TAM-6909 | TBC |
| 3.1 | NHI repricing | 1 | Palau | | TBC |
| 3.2 | NHI co-payment | 1 | Palau | TAM-6835 | TBC |
| 3.3 | Split an invoice between payers | 1 | Generic | TAM-7186 | TBC |
| 3.4 | Group invoice items by encounter type | 1 | Generic | TAM-6942 | TBC |
| 4.1 | Drug categories | 1 | Generic | | TBC |
| 4.2 | Medication block pricing | 1 | Generic | | TBC |
| 4.3 | Separate inpatient and discharge medication charges | 1 | Generic | | TBC |
| 4.4 | Per-vial dose charge | 1 | Generic | | TBC |
| 4.5 | Medication rules after 30 days | 1 | Palau | | TBC |
| 4.6 | BH medication charge on the discount pathway | 1 | Palau | | TBC |
| 5.1 | MSA payment details | 1 | Palau | TAM-7187 | TBC |
| 5.2 | MSA pending payments | 1 | Palau | | TBC |
| 5.3 | Patient statement of account | 1 | Generic | TAM-7193 | TBC |
| 5.4 | Daily cash receipts report | 1 | Palau | | TBC |
| 5.5 | Payer exports | 1 | Palau | | TBC |
| 6.1 | Department consult fees | 2 | Generic | | TBC |
| 6.2 | Room rate change after 30 nights | 2 | Generic | | TBC |
| 6.3 | Theatre and recovery time charges | 2 | Generic | | TBC |
| 6.4 | Monthly insurance coverage import | 2 | Generic | | TBC |
| 6.5 | Move an item to self-pay | 2 | Generic | | TBC |
| 6.6 | Diagnosis completeness for insurance | 2 | Generic | | TBC |
| 6.7 | Provider numbers | 2 | Generic | | TBC |
| 6.8 | CPT code search | 2 | Generic | | TBC |
| 6.9 | Payment plans | 2 | Generic | | TBC |

---

## Phase 1

Phase 1 is most of the project for one developer between 12 Oct and 20 Nov 2026. The steps are ordered so that each finished step is usable on its own. Step 4 (medication rules) can run in parallel with steps 2 and 3.

### Step 1. Patient billing profile and pathway selection

#### 1.1 Patient billing profile

**Existing functionality**
- The patient record holds ethnicity, nationality, and mother and father links
- Custom patient fields can hold extra data, but pricing doesn't read them
- The sliding fee scale (household size × income) is a per-invoice discount. The assessment is filled in again on every invoice and isn't linked to family

**Requirements**
- Store billing data on the patient: income, family size, payor, spouse link, adoption number, marriage licence
- The sliding fee assessment is kept on the profile and reused by later invoices
- The assessment links to family
- Detailed shape can be filled in during card shaping

#### 1.2 Time-bound patient statuses

**Existing functionality**
- Billing type is a single value on the patient and the encounter, with no start or end date
- The encounter's billing type selects the price list
- There's no BH, disabled, inmate or non-chargeable status

**Requirements**
- Statuses carry start and end dates, so a status applies only to encounters within its dates
- The list of statuses is configured per site
- Pricing reads the statuses in force for the encounter

#### 1.3 Payment pathway on the invoice

**Existing functionality**
- One price list applies per encounter, chosen by billing type, facility and age
- Insurance plans on the patient are copied to the invoice. Each plan covers a fixed percentage per product, for products marked insurable
- An invoice-level discount (manual, or from the sliding fee scale) applies to the patient's share after insurance
- Nothing stops a discount and insurance applying to the same bill

**Requirements**
- The invoice carries one payment pathway: NHI, private insurance, patient-type discount, workers comp or non-chargeable
- One pathway per bill is enforced. A patient-type discount and insurance can't both apply
- The cashier can choose or change the pathway on the invoice
- The pathway drives the calculation for every line on the bill

#### 1.4 BNH patient types and precedence

**Existing functionality**
- A patient type can be approximated with a price list per billing type, or a manual discount
- A price list per billing type keeps category exceptions and reprices live until finalisation, but every product must be priced on every list (unpriced = $0) and only one billing type applies at a time
- The sliding fee scale and NHI can't be expressed as a price list

**Requirements**
- Configure the BNH patient types and what each pays:
  - Palauan sliding scale: 20–70%
  - Yap: 50%
  - Foreigner: 80%
  - Inmate: 20%
  - BH or disabled: 5%
  - Pensioner: 5%
  - Tourist: 100%
  - Volunteer: 0%
- Precedence when more than one type applies (e.g. a disabled inmate, a disabled child of an earning parent). Rules not yet decided

### Step 2. Discount category exclusions and minimum charge

#### 2.1 Discount category exclusions

**Existing functionality**
- The invoice-level discount applies to every line
- A cashier can discount a single line by hand, as a percentage or an amount
- Products carry an `insurable` flag, which controls insurance only. The old `discountable` flag was replaced by it

**Requirements**
- A discount pathway can exclude item categories, which are charged at 100% (meds, supplies, ER fees at BNH)
- Individual products can be marked as never discounted

#### 2.2 Minimum charge per product (TAM-6909)

**Existing functionality**
- Each product has a price per price list
- A cashier can override a line's price by hand

**Requirements**
- A product can carry a minimum charge (e.g. CT)

### Step 3. NHI repricing, co-payment and the ER/ward split

#### 3.1 NHI repricing

**Existing functionality**
- Insurance coverage is a fixed percentage per product per plan
- A price list per billing type could hold NHI rates, but only while NHI is the encounter's billing type
- Bed fees are charged per night at the rate for the patient's location, one line per location. The rate doesn't change with length of stay

**Requirements**
- On the NHI pathway, lines are repriced at NHI rates:
  - Labs and radiology: 50%
  - Rooms: $65 a night, then $20 after 30 nights
  - ICU: $115 a night, then $70 after 30 nights
  - Meds: 100%

#### 3.2 NHI co-payment (TAM-6835)

**Existing functionality**
- The patient owes whatever insurance doesn't cover, line by line
- There's no income on the patient and no income-based ceiling

**Requirements**
- The patient pays the lower of 20% of the full-price bill and their income ceiling
- The income ceiling comes from the income on the patient billing profile (1.1)
- The rest of the bill is billed to NHI

#### 3.3 Split an invoice between payers (TAM-7186)

**Existing functionality**
- One invoice per encounter
- Insurance plans attach to the whole invoice and cover every insurable line
- A patient admitted from ED keeps the ED encounter fee on the same invoice

**Requirements**
- One encounter can be split between payers by portion. The ER portion isn't covered by NHI, the ward portion is
- NHI can start or stop part way through a stay
- Hemodialysis and physio are always billed as outpatient

#### 3.4 Group invoice items by encounter type (TAM-6942)

**Existing functionality**
- The encounter records each change of encounter type
- Invoice items are listed in one list, on screen and on the printout, with no encounter type shown

**Requirements**
- When an encounter crosses encounter types (e.g. emergency then inpatient), invoice items are grouped by encounter type on screen and on the printout
- When an item is added or backdated to a day the patient moved, the user picks which encounter type it belongs to
- Designs are linked on TAM-6942

### Step 4. Medication rules

Can run in parallel with steps 2 and 3.

#### 4.1 Drug categories

**Existing functionality**
- Drug reference data holds route, dosing and dispensing units, unit conversion and notes. There's no category

**Requirements**
- Drugs carry a category, A to D

#### 4.2 Medication block pricing

**Existing functionality**
- A drug line is charged per unit (price × dispensing units) or as one flat fee
- The charging type is set per drug per price list

**Requirements**
- Block pricing is a charging type alongside per unit and flat fee
- BNH rules: tablets ÷ 20 × $5, and ÷ 30 × $6 for category D

#### 4.3 Separate inpatient and discharge medication charges

**Existing functionality**
- Administered and discharge quantities share one invoice line
- A facility can bundle administered medications into the admission fee, leaving discharge medications charged

**Requirements**
- Inpatient (administered) and discharge medications are charged separately

#### 4.4 Per-vial dose charge

**Existing functionality**
- Injectables are charged like any other drug: per dispensing unit or as a flat fee

**Requirements**
- Injectables are charged $5 per vial dose

#### 4.5 Medication rules after 30 days

**Existing functionality**
- Medication charging doesn't change with length of stay

**Requirements**
- Different medication charging rules apply after 30 days. Detailed shape can be filled in during card shaping

#### 4.6 BH medication charge on the discount pathway

**Existing functionality**
- A drug's price comes from the encounter's price list. Nothing ties a price to the payment pathway

**Requirements**
- BH meds are charged at $1, only on the patient-type discount pathway

### Step 5. Payments and reports

#### 5.1 MSA payment details (TAM-7187)

**Existing functionality**
- A patient payment records date, method, amount and receipt number, plus a cheque number for cheques. Payments can be edited and refunded
- Payment methods are configured as reference data

**Requirements**
- An MSA payment records the HCF reference and one or more SSNs

#### 5.2 MSA pending payments

**Existing functionality**
- A patient payment counts towards the balance as soon as it's recorded
- Insurer payments have a status (unpaid, paid, partial, rejected). Patient payments don't

**Requirements**
- An MSA payment can be recorded as pending until the cash arrives

#### 5.3 Patient statement of account (TAM-7193)

**Existing functionality**
- The patient's Invoices tab lists each invoice with date, number, encounter type, patient total, payment status and balance
- Each invoice can be printed on its own

**Requirements**
- A statement across the patient's invoices showing what self-pay and each insurer owe
- Includes discharge date, hospital number and self-pay details

#### 5.4 Daily cash receipts report

**Existing functionality**
- No built-in report. SQL reports can be written against invoice and payment data

**Requirements**
- A daily cash receipts report, one line per item. Possible as a SQL report

#### 5.5 Payer exports

**Existing functionality**
- Insurer payments can be imported through the admin importer to clear balances, matched by invoice number
- There's no export to payers

**Requirements**
- Exports to NHI, MSA and private insurers

---

## Phase 2

### 6.1 Department consult fees

**Existing functionality**
- Outpatient and ED encounter fees are chosen by encounter type and time of day
- Only the walk-in pharmacy department gets its own fee

**Requirements**
- Doctor (99210) and nurse (99211) consult fees by area, e.g. ENT, OPD Nursing Clinic

### 6.2 Room rate change after 30 nights

**Existing functionality**
- Bed fees are charged per night at the rate for the patient's location. The rate doesn't change with length of stay

**Requirements**
- A room rate changes after a configured number of nights

### 6.3 Theatre and recovery time charges

**Existing functionality**
- Procedures record start, end, time-in and time-out times
- A procedure's invoice line takes its quantity from the procedure, not from time

**Requirements**
- Operating room and recovery room charged per 15 minutes

### 6.4 Monthly insurance coverage import

**Existing functionality**
- Insurance plans are added to each patient by hand, with no effective dates

**Requirements**
- Import active coverage each month. Needs effective dates on patient insurance

### 6.5 Move an item to self-pay

**Existing functionality**
- An insurance plan on the invoice covers every insurable line

**Requirements**
- Move a single item from the insurer to self-pay

### 6.6 Diagnosis completeness for insurance

**Existing functionality**
- Diagnoses print on the invoice but aren't required

**Requirements**
- A diagnosis is required for insurance claims
- A Medical Records form to backfill missing diagnoses

### 6.7 Provider numbers

**Existing functionality**
- Each invoice item records the clinician who ordered it
- Clinicians have no provider number

**Requirements**
- A provider number per doctor, for insurance claims

### 6.8 CPT code search

**Existing functionality**
- Products carry a CPT code
- Product search matches name only. The workaround is putting the code in the name

**Requirements**
- Product search matches CPT code as well as name

### 6.9 Payment plans

**Existing functionality**
- Payments are recorded one at a time, and a partly paid invoice shows as partial

**Requirements**
- Payment plans. Detailed shape can be filled in during card shaping

---

## Handled by configuration

No build needed. Set up during deployment.

- CPT codes on products
- Fluid bags and dressings as procedures, supplies added by hand, consumables included in the procedure price
- Anaesthesia with or without the procedure, as separate procedure types
- Free HIV/TB meds: $0 or hidden
- ER physician fee, via the ED encounter fee
- Room rate per ward
- Workers comp at 100%
- Private insurance co-payment, recorded as a normal patient payment
- Insurer payment import to clear balances (admin importer, matched by invoice number)
- UDS, as a SQL report

---

## Dependencies

- The updated CPT list from Quintina Nestor
- The provider number list from John Macatangay

---

## Open questions

**For BNH finance**

- NHI income brackets: 11,200–11,999 is missing, and the top two brackets are both $400. TAM-6835 uses ">11,200 = $400"
- The dependant age for children: 19, 21 or 25
- The tablet-block rule: 20 tablets per block, or ÷ 30 for category D (both marked as possibly out of date)
- The pensioner age: over 55, or 55 and over
- What a disabled foreigner or a foreign inmate pays
- The precedence rules for patients with more than one type (1.4)

**For the project**

- NHI room and ICU rates change after 30 nights (3.1), but the room rate change after 30 nights is in phase 2 (6.2). Either 3.1 handles the NHI case itself or 6.2 moves into phase 1
- Not yet placed in a phase:
  - Insurance price as a fixed amount, not a percentage (TAM-6910)
  - Search by invoice number (TAM-2150)
  - Signature, person responsible and witness fields on the invoice printout (TAM-7191)
