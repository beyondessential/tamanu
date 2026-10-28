---
id: PDET
---

# Patient details

The patient's Details tab, where their demographic, identification, contact, location and
billing information is recorded and edited. Fields are grouped into headed sections.

## Sections

- [ ] The Details tab shows its sections in this order: Birth details (for patients
      registered through the birth registry), Identification information, Contact
      information, Personal information, Location information, Billing information.
- [ ] Each field can be hidden, made required, or made required when creating a patient
      through the patient field settings, the same way for every field in every section.
- [ ] A section whose fields are all hidden is not shown, heading included.

## Identification information

- [ ] Identification information holds, in order: display ID (where editing it is
      enabled), birth certificate, driving licence (for new patients), passport number,
      adoption number, and marriage licence.
- [ ] Adoption number and marriage licence are free-text fields, recorded on the
      patient's record and editable from the Details tab.

## Billing information

The details used to bill the patient, grouped together so they are found in one place.

- [ ] Billing information holds, in order: insurer and insurance policy number (where
      patient insurers are enabled), insurance plan, patient type, family size, annual
      income, Payor 1, Payor 1 reference number, Payor 2, and Payor 2 reference number.
      Each payor's reference number sits beside it.
- [ ] Insurance plan accepts more than one plan, chosen from the insurance plans
      available to patients.
- [ ] Patient type is chosen from the patient billing types.
- [ ] Family size is chosen from a list with one option for each family size the sliding
      fee scale setting covers, numbered from 1.
- [ ] Annual income is chosen from the sliding fee scale's income bands for the selected
      family size. Each band is shown as a range from its lower bound to the next band's,
      and the highest band as anything above its lower bound.
- [ ] Annual income cannot be chosen until a family size is selected. Changing the family
      size clears the annual income, since its bands no longer apply.
- [ ] When the patient's insurance plans include Sliding fee scale, family size and annual
      income are required, and the patient's details are not saved until both are chosen.
- [ ] Saving without a family size shows "Family size is required for sliding fee scale"
      on the family size field. Once a family size is chosen, saving without an annual
      income shows "Annual income is required for sliding fee scale" on the annual income
      field. These replace the standard required message.
- [ ] Removing Sliding fee scale from the insurance plans lifts the requirement and clears
      these messages.
- [ ] A saved annual income band stays on the patient's record and is shown as saved when
      the sliding fee scale has since changed and no longer has that band, until a current
      band is chosen in its place.
- [ ] Payor 1 and Payor 2 are each chosen by searching existing patient records, the
      same way as the patient's mother and father. Each match shows the patient's name,
      display ID, sex and date of birth.
- [ ] Each payor's reference number is a free-text field.
- [ ] Annual income, family size, both payors and their reference numbers are recorded on
      the patient's record and editable from the Details tab.

## Creating a patient

- [ ] When creating a patient, any field from any section that is set as required when
      creating a patient appears on the new patient form, including the Billing
      information fields and the adoption number and marriage licence fields.
