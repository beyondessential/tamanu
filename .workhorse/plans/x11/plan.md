# Billing information section on patient details

Branches off `epic-palau-invoicing`, not `main`, so it lands alongside the rest of the
Palau invoicing work.

## Decisions

- Billing information is a new section on the patient details form, below Location information. It holds insurance policy number (moved from Identification information), insurance plan and patient type (moved from Personal information), plus annual income, family size, Payor 1 and Payor 2, each with its own reference number (Payor 1 reference number, Payor 2 reference number)
- Payor 1 and Payor 2 link to other patient records, stored and searched the same way as mother and father (a patient reference on the patient's additional data, chosen through the patient suggester). Each has its own free-text reference number field beside it
- Family size and annual income are new fields on the patient record, both chosen from dropdowns built from the sliding fee scale setting, the same way as the invoice discount assessment (`InvoiceDiscountAssessmentForm.jsx`): one family size per row of the scale, and annual income as the chosen row's income bands. Family size comes first because the bands depend on it
- Derive the family size options from the number of rows in the sliding fee scale setting, rather than the assessment's hard-coded maximum of 12
- Annual income is stored as the band's display string, the same value the assessment form already uses for its options. A band index would re-point to a different range when the scale is edited, which would break the rule that a saved band still shows as saved after a scale change
- The invoice discount assessment pre-fills from the patient's saved family size and annual income. Changes made there apply to that invoice only and are not written back to the patient
- Adoption number and marriage licence are new text fields at the end of Identification information
- The new fields are hidden by default so only deployments that turn them on see them. `generateFieldSchema` (`packages/settings/src/schema/definitions/fields.ts`) hard-codes `hidden` to default `false`, so it takes a `defaultHidden` option
- Web only, and mobile needs no migration at all. Mobile's `PatientAdditionalData` already carries only the columns it uses — it never had `insurerId` or `insurerPolicyNumber` — and sync is safe both ways without the new ones: a pull picks mobile's own columns (`buildFromSyncRecord`), and a push that omits a field leaves it alone on central, because `lastWriteWinsPerField` keeps the existing value when the incoming record has no tick for that field
- Payor search excludes deceased patients, so it needs its own suggester rather than reusing the patient suggester as it is

## The sliding fee scale plan

Family size and annual income become required when the patient's insurance plans include
the sliding fee scale plan. The plan is recognised through a new setting holding its code,
`invoicing.slidingFeeScalePlanCode`, defaulting to `sliding-fee-scale`:

- `invoice_insurance_plans.code` is already unique, so a code is a stable identifier
- Matching on the plan's name would break against translation and against a deployment that
  words it differently
- A setting keeps it deployment-tunable without a migration, which is what the repo's
  settings rule asks for

## Removing the patient insurer

`insurerId` goes from the patient record entirely, replaced by insurance plans.
`insurerPolicyNumber` stays and moves into Billing information. `features.enablePatientInsurer`
stays as the gate on the policy number, so no deployment has to change settings to keep what
it has today.

The removal reaches: the details form and its validations, the patient portal's editable
"Health insurer" field, `PATIENT_SEARCH_PAD_FIELDS`, the facility `createPatient` schema, the
patient portal request and response schemas, the invoice record printout's legacy fallback,
the `insurerId` patient field setting, the dbt source model, and the `insurer` reference data
type along with its demo data, fake-data name pool and default provisioning sheet.

## Importing

The patient importer needs no new wiring for most of this: `patientDataLoader` pushes any
Patient-sheet column matching a `PatientAdditionalData` attribute into the additional data
record, so the new columns are importable as soon as the model carries them. An imported
annual income band is stored as given rather than validated against the current scale, which
matches how a saved band behaves when the scale changes.

Insurance plan is the exception — it lives on `patient_invoice_insurance_plans`, not the
additional data, so it has no import path. That is a follow-up card, not this one.

## Build steps

- [ ] Settings: `defaultHidden` on `generateFieldSchema`, the new patient field settings, the sliding fee scale plan code setting, and the `insurerId` field setting removed
- [ ] Server migrations: add the new `patient_additional_data` columns, drop `insurer_id`
- [ ] `PatientAdditionalData` model: new columns, payor relations, `insurerId` gone
- [ ] Payor suggester excluding deceased patients
- [ ] Billing information section on the details form, with the fields moved into it
- [ ] Adoption number and marriage licence on Identification information
- [ ] Sliding fee scale conditional validation with its two messages, raised on Save only
- [ ] Invoice discount assessment pre-filled from the patient's saved answers
- [ ] Insurer removal across web, portal, schemas, constants, printout and seed data
- [ ] dbt source model regenerated
- [ ] Tests
