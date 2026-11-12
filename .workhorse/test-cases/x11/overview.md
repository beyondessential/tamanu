# Billing information on patient details

Scenarios that verify this card. Web only; mobile has no patient billing UI.

## Test environment

The preview deployment at https://facility-1.workhorse-x11.cd.tamanu.app is configured for these
scenarios. Log in as `admin@tamanu.io` / `admin`, facility Test Facility 1.

What is set up on it:

- Every Billing information field shown: `fields.{adoptionNumber,marriageLicence,familySize,annualIncome,payor1Id,payor1ReferenceNumber,payor2Id,payor2ReferenceNumber}.hidden` set to false, since all eight ship hidden
- `features.enablePatientInsurer` on, so insurance policy number appears
- `features.invoicing.enabled` and `features.invoicing.slidingFeeScale` on, so the discount assessment can be reached; the deployment already carries invoice products and a price list
- An `invoiceInsurancePlan` named **Sliding fee scale**, code `sliding-fee-scale`, matching `invoice.slidingFeeScalePlanCode`. Without it nothing makes family size and annual income required
- `features.patientPortal` on, for the portal cases
- **Adeline Giannoni (RQLN820387)** carries a worked example: every billing and identification field filled, the sliding fee scale plan selected, family size 3 and annual income 7,400 - 17,000. The other patients are untouched, for the plan-not-selected state

Two things to know while testing:

- A settings change on the admin panel reaches facility-1 by sync, about a minute later. A screen that looks unchanged straight after a settings save has usually just not caught up
- The deployment's browser-support gate refuses Playwright's bundled Chromium with "Tamanu is not available on your browser". Drive it with the installed Chrome (`channel: 'chrome'`) instead

## Section layout

- [x] The Details tab shows Billing information below Location information, and above any
      custom patient field groups (verifies spec: PDET)
- [x] Patient type is shown in Billing information rather than Personal information, and
      saves and reads back from there (verifies spec: PDET)
- [x] Billing information holds, in order: insurance policy number, insurance plan, patient
      type, family size, annual income, Payor 1, Payor 1 reference number, Payor 2, Payor 2
      reference number (verifies spec: PDET)
- [x] Identification information ends with adoption number then marriage licence
      (verifies spec: PDET)
- [x] With every Billing information field hidden in patient field settings, the section and
      its heading do not appear at all (verifies spec: PDET)
- [x] Hiding every field of any other section (for example Contact information) likewise
      leaves out its heading (verifies spec: PDET)
- [x] Out of the box, adoption number, marriage licence, family size, annual income, both
      payors and both reference numbers are hidden until a deployment shows them
      (verifies spec: PDET)

## Sliding fee scale

- [x] Family size offers one option per row of the sliding fee scale setting, numbered from 1
      (verifies spec: PDET)
- [x] Annual income offers the chosen family size's bands, each a range to the next band's
      lower bound, with the highest shown as above its own (verifies spec: PDET)
- [x] Annual income is disabled until a family size is chosen (verifies spec: PDET)
- [x] Changing the family size clears a previously chosen annual income (verifies spec: PDET)
- [x] Selecting the sliding fee scale plan marks family size and annual income as required
      straight away, before Save is selected (verifies spec: PDET)
- [x] Saving with the sliding fee scale plan and no family size shows "Family size is
      required for sliding fee scale" on the family size field (verifies spec: PDET)
- [x] With a family size chosen, saving without an annual income shows "Annual income is
      required for sliding fee scale" on the annual income field (verifies spec: PDET)
- [x] Neither message appears before Save is selected; choosing a value afterwards clears
      that field's message without raising one on the other until Save again
      (verifies spec: PDET)
- [x] Removing the sliding fee scale plan drops the required marks and clears both messages
      (verifies spec: PDET)
- [x] The requirement holds when the sliding fee scale plan is renamed, and does not apply to
      a plan whose code is not the configured one (verifies spec: PDET)
- [x] An annual income saved against a scale that has since changed still shows as saved on
      the Details tab until a current band is chosen (verifies spec: PDET)
- [x] An income band belonging to a different family size is rejected as a missing answer
      (verifies spec: PDET)

- [x] Every configurable patient field has a validation entry, including the new billing ones,
      and insurer no longer has one

## Payors

- [x] Payor 1 and Payor 2 search existing patients, each match showing name, display ID, sex
      and date of birth (verifies spec: PDET)
- [x] A deceased patient is not offered as a payor (verifies spec: PDET)
- [x] The patient being edited can be chosen as their own payor (verifies spec: PDET)
- [x] Each payor's reference number saves as free text (verifies spec: PDET)

## Creating a patient

- [x] A Billing information field set as required when creating a patient appears on the new
      patient form (verifies spec: PDET)
- [x] Adoption number and marriage licence set as required when creating appear there too
      (verifies spec: PDET)
- [x] Choosing the sliding fee scale plan on the new patient form brings up family size and
      annual income as required, with the same messages (verifies spec: PDET)
- [x] Removing the sliding fee scale plan takes them off the form again, unless they are set
      as required when creating (verifies spec: PDET)

## Invoice discount assessment

- [x] The assessment opens with the patient's saved family size and annual income already
      selected (verifies spec: INVOICING)
- [x] A saved band the current scale no longer offers for that family size is left unselected
      (verifies spec: INVOICING)
- [x] Changing an answer in the assessment applies to that invoice's discount and leaves the
      patient's details unchanged (verifies spec: INVOICING)
- [x] The discount is the remainder of the proportion the chosen band pays

- [x] Annual income marked required-when-creating while family size is hidden does not block the
      save against a permanently disabled field (verifies spec: PDET)

## Removing the patient insurer

- [x] Insurer no longer appears on the Details tab or the new patient form
- [x] Insurance policy number still appears, in Billing information, and is still gated by
      features.enablePatientInsurer
- [x] The patient portal's details and edit screens no longer offer Health insurer, and still
      offer Policy number (verifies spec: PPDET)
- [x] An invoice record printout shows the invoice's insurance plans, and no longer falls back
      to the patient's insurer when the invoice has none
- [x] A patient saved before the upgrade keeps its insurance policy number

## Importing

- [x] A patient import sheet carrying adoption number, marriage licence, family size, annual
      income, both payor ids and both reference numbers saves them onto the patient
      (verifies spec: PTDATA)
- [x] An annual income the current sliding fee scale does not cover imports as given rather
      than erroring (verifies spec: PTDATA)

## Migration and sync

- [x] The new columns are added and insurer_id dropped, and both migrations reverse cleanly
- [x] A facility server syncing against a central server that has dropped insurer_id applies
      patient additional data without error
- [x] Mobile, which carries neither the new columns nor insurer_id, can still push a patient
      additional data edit without clearing the billing fields on central
