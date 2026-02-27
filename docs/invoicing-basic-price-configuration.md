# Invoicing Module - Basic Price Configuration

## Overview

This guide explains how to configure the Tamanu invoicing module with a single universal price list that applies to all patients and facilities. This is the simplest possible setup to get invoicing operational.

The invoicing pricing system requires three types of reference data:

1. **Invoice Price List** - Defines the price list itself
2. **Invoice Product** - Defines billable items (consultations, procedures, tests, etc.)
3. **Invoice Price List Item** - Assigns specific prices to products within a price list

## How Price Matching Works

When a user creates an invoice for a patient encounter, the system:

1. Evaluates all price lists to find which one matches the encounter's attributes (facility, patient type, patient age)
2. Uses the matching price list to look up default prices for invoice items
3. Pre-fills prices when available, or requires manual entry if no price is defined

A price list with no `rules` field matches all encounters universally. This is what we'll use for the basic setup.

## Import Process

These reference data tables should be uploaded via the Tamanu admin panel's reference data import feature. The system expects specific column headers and data formats.

---

## Table 1: Invoice Price List

Create a spreadsheet tab named **"Invoice Price List"** with the following structure:

```
id	code	name	visibilityStatus
invoicePriceList-default	invoicePriceList-default	Default Price List	current
```

**Column Definitions:**

- `id` - Unique identifier for the price list record (used internally and for references)
- `code` - Unique code for the price list (must match what you use in the Price List Item table)
- `name` - Display name shown to users in the interface
- `visibilityStatus` - Must be `current` for active price lists (use `historical` to hide from selection)

**Key Points:**

- Do not include a `rules` column - its absence means this price list matches all encounters
- The `id` and `code` can be the same value for simplicity
- Only one row is needed for a universal price list

---

## Table 2: Invoice Product

Create a spreadsheet tab named **"Invoice Product"** with the following structure:

```
id	name	category	sourceRecordId	insurable	visibilityStatus
invoiceProduct-consultation-standard	Standard Consultation			TRUE	current
invoiceProduct-consultation-extended	Extended Consultation			TRUE	current
invoiceProduct-consultation-specialist	Specialist Consultation			TRUE	current
invoiceProduct-emergency-attendance	Emergency Department Attendance			TRUE	current
invoiceProduct-admission-daily	Daily Ward Admission			TRUE	current
invoiceProduct-xray-chest	Chest X-Ray			TRUE	current
invoiceProduct-xray-limb	Limb X-Ray			TRUE	current
invoiceProduct-ultrasound-abdomen	Abdominal Ultrasound			TRUE	current
invoiceProduct-ultrasound-obstetric	Obstetric Ultrasound			TRUE	current
invoiceProduct-ct-scan-head	CT Scan - Head			TRUE	current
invoiceProduct-lab-fbc	Full Blood Count (FBC)			TRUE	current
invoiceProduct-lab-malaria	Malaria Test			TRUE	current
invoiceProduct-lab-glucose	Blood Glucose Test			TRUE	current
invoiceProduct-lab-urinalysis	Urinalysis			TRUE	current
invoiceProduct-ecg	ECG / EKG			TRUE	current
invoiceProduct-dressing-simple	Simple Wound Dressing			TRUE	current
invoiceProduct-dressing-complex	Complex Wound Dressing			TRUE	current
invoiceProduct-suturing	Suturing / Stitches			TRUE	current
invoiceProduct-casting	Plaster Cast Application			TRUE	current
invoiceProduct-immunization-tetanus	Tetanus Vaccination			TRUE	current
invoiceProduct-immunization-hepatitisb	Hepatitis B Vaccination			TRUE	current
invoiceProduct-iv-fluids	IV Fluid Administration (per bag)			TRUE	current
invoiceProduct-medication-paracetamol	Paracetamol 500mg Tablet			TRUE	current
invoiceProduct-medication-amoxicillin	Amoxicillin 500mg Capsule			TRUE	current
invoiceProduct-medication-ibuprofen	Ibuprofen 400mg Tablet			TRUE	current
invoiceProduct-physiotherapy	Physiotherapy Session			TRUE	current
invoiceProduct-counseling	Patient Counseling Session			TRUE	current
invoiceProduct-surgical-minor	Minor Surgical Procedure			TRUE	current
invoiceProduct-surgical-intermediate	Intermediate Surgical Procedure			TRUE	current
invoiceProduct-anesthesia-local	Local Anesthesia			TRUE	current
```

**Column Definitions:**

- `id` - Unique identifier for the product (referenced in Price List Item table)
- `name` - Display name shown when adding items to invoices
- `category` - Optional. Valid values: `Drug`, `ProcedureType`, `ImagingType`, `ImagingArea`, `LabTestType`, `LabTestPanel`. Leave empty for standalone items.
- `sourceRecordId` - Optional. Links to existing reference data (e.g., `drug-paracetamol500`). Leave empty for standalone items.
- `insurable` - `TRUE` if the item can be claimed through insurance; `FALSE` if not eligible for insurance claims
- `visibilityStatus` - Must be `current` for active products

**Key Points:**

- Use descriptive, medical-appropriate names
- Set `insurable` to `FALSE` for items not eligible for insurance claims (if applicable to your insurance setup)
- `category` and `sourceRecordId` are only needed if linking to existing reference data (advanced use case)

---

## Table 3: Invoice Price List Item

Create a spreadsheet tab named **"Invoice Price List Item"** with the following structure:

The column header format is special: the first column is always `invoiceProductId`, and subsequent columns are price list codes from Table 1.

```
invoiceProductId	invoicePriceList-default
invoiceProduct-consultation-standard	45.00
invoiceProduct-consultation-extended	75.00
invoiceProduct-consultation-specialist	120.00
invoiceProduct-emergency-attendance	80.00
invoiceProduct-admission-daily	150.00
invoiceProduct-xray-chest	65.00
invoiceProduct-xray-limb	55.00
invoiceProduct-ultrasound-abdomen	180.00
invoiceProduct-ultrasound-obstetric	200.00
invoiceProduct-ct-scan-head	450.00
invoiceProduct-lab-fbc	35.00
invoiceProduct-lab-malaria	20.00
invoiceProduct-lab-glucose	15.00
invoiceProduct-lab-urinalysis	18.00
invoiceProduct-ecg	40.00
invoiceProduct-dressing-simple	25.00
invoiceProduct-dressing-complex	60.00
invoiceProduct-suturing	85.00
invoiceProduct-casting	95.00
invoiceProduct-immunization-tetanus	30.00
invoiceProduct-immunization-hepatitisb	45.00
invoiceProduct-iv-fluids	35.00
invoiceProduct-medication-paracetamol	0.50
invoiceProduct-medication-amoxicillin	1.20
invoiceProduct-medication-ibuprofen	0.80
invoiceProduct-physiotherapy	50.00
invoiceProduct-counseling	40.00
invoiceProduct-surgical-minor	250.00
invoiceProduct-surgical-intermediate	500.00
invoiceProduct-anesthesia-local	75.00
```

**Column Definitions:**

- `invoiceProductId` - Must match `id` values from the Invoice Product table
- `invoicePriceList-default` - Column header must match the `code` from the Invoice Price List table. Cell values are prices.

**Price Values:**

- Numeric values (e.g., `45.00`, `0.50`) - Defines the default price for this item
- Empty cell - Item can be added to invoices, but staff must manually enter the price
- `hidden` - Item will not appear in the invoice item picker for this price list

**Key Points:**

- The price list column name must exactly match the price list code
- Prices can include decimals for currency subunits
- Items without prices (empty cells) are useful for variable-cost items or when prices are facility-specific but not captured in the system

---

## After Import

Once imported:

1. Verify import success in the admin panel - check for any validation errors
2. The price list will automatically apply to all invoices created system-wide
3. When users add items to an invoice, prices will auto-populate from this table
4. Users can still override prices manually if permitted by their role

## Validation Rules

The import will fail if:

- `code` is duplicated in the Invoice Price List table
- `id` is duplicated in the Invoice Product table
- `invoiceProductId` in the Price List Item table references a non-existent product
- Price list code column in Price List Item table references a non-existent price list
- Price values are non-numeric (except for `hidden` or empty)
- `category` values are not one of the valid constants (must be exact case-sensitive match)

## Next Steps

After establishing the basic setup, you can expand to multiple price lists with matching rules (facility-specific, patient-type-specific, age-based) by:

1. Adding additional rows to the Invoice Price List table with `rules` defined
2. Adding corresponding columns to the Invoice Price List Item table
3. Ensuring rules don't overlap (system throws error if multiple price lists match)

For advanced configuration including price list matching rules, see the separate detailed pricing documentation.
