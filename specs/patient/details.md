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
      patient insurers are enabled), insurance plan, patient type, annual income, family
      size, Payor I, Payor I reference number, Payor II, and Payor II reference number.
      Each payor's reference number sits beside it.
- [ ] Insurance plan accepts more than one plan, chosen from the insurance plans
      available to patients.
- [ ] Patient type is chosen from the patient billing types.
- [ ] Annual income is a number of zero or more, and may include decimals.
- [ ] Family size is a whole number of one or more.
- [ ] A value outside these ranges is rejected with a validation message on the field,
      and the patient's details are not saved until it is corrected.
- [ ] Payor I and Payor II are each chosen by searching existing patient records, the
      same way as the patient's mother and father. Each match shows the patient's name,
      display ID, sex and date of birth.
- [ ] Each payor's reference number is a free-text field.
- [ ] Annual income, family size, both payors and their reference numbers are recorded on
      the patient's record and editable from the Details tab.

## Creating a patient

- [ ] When creating a patient, any field from any section that is set as required when
      creating a patient appears on the new patient form, including the Billing
      information fields and the adoption number and marriage licence fields.
