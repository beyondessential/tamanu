---
id: PDET
---

# Patient details

The patient's Details tab, where their demographic, identification, contact, location and billing information is recorded and edited. Fields are grouped into headed sections.

## Sections

- The Details tab shows its sections in this order: General information, Birth details (for patients registered through the birth registry), Identification information, Contact information, Personal information, Location information, Billing information. Any custom patient field groups follow Billing information.
- Each field can be hidden, made required, or made required when creating a patient through the patient field settings, the same way for every field in every section.
- Adoption number, marriage licence, family size, annual income, both payors and their reference numbers are hidden unless a deployment's patient field settings show them.
- A section whose fields are all hidden is not shown, heading included.

## Identification information

- Identification information holds, in order: display ID (where editing it is enabled), birth certificate, driving licence (for patients not registered through the birth registry), passport number, adoption number, and marriage licence.
- Adoption number and marriage licence are free-text fields, recorded on the patient's record and editable from the Details tab.

## Billing information

The details used to bill the patient, grouped together so they are found in one place.

- Billing information holds, in order: insurance plan, patient type, family size, annual income, Payor 1, Payor 1 reference number, Payor 2, Payor 2 reference number, and insurance policy number (where a deployment enables it).
- Family size sits beside annual income, and each payor beside its own reference number.
- Insurance plan accepts more than one plan, chosen from the insurance plans available to patients.
- An insurance plan that is on one of the patient's in-progress invoices cannot be removed. Saving shows a message naming the plan and asking for it to be removed from the invoices first.
- Patient type is chosen from the patient billing types.
- Family size is chosen from a list with one option for each family size the sliding fee scale setting covers, numbered from 1.
- Annual income is chosen from the sliding fee scale's income bands for the selected family size. Each band is shown as a range from its lower bound to the next band's, and the highest band as anything above its lower bound.
- Annual income cannot be chosen until a family size is selected. Changing the family size clears the annual income, since its bands no longer apply.
- The sliding fee scale plan is recognised by its plan code, which a deployment names in its settings, so the requirement holds whatever the plan is called and whatever language it is read in.
- When the patient's insurance plans include Sliding fee scale, family size and annual income are required, and the patient's details are not saved until both are chosen. Both are marked as required as soon as Sliding fee scale is selected.
- Saving without a family size shows "Family size is required for sliding fee scale" on the family size field. Once a family size is chosen, saving without an annual income shows "Annual income is required for sliding fee scale" on the annual income field. These replace the standard required message.
- These messages appear only when Save is selected. Choosing a value afterwards clears that field's message without raising one on another field until Save is selected again.
- Removing Sliding fee scale from the insurance plans lifts the requirement, removing the required marks and clearing these messages.
- A saved annual income band stays on the patient's record and is shown as saved when the sliding fee scale has since changed and no longer has that band, until a current band is chosen in its place.
- Payor 1 and Payor 2 are each chosen by searching existing patient records, the same way as the patient's mother and father. Each match shows the patient's name, display ID, sex and date of birth. Deceased patients are not offered. The patient being edited can be chosen as their own payor.
- Each payor's reference number is a free-text field.
- Annual income, family size, both payors and their reference numbers are recorded on the patient's record and editable from the Details tab.

> [!NOTE]
> Insurance policy number comes last because it is the only field in the section a deployment can switch off. The fields lay out two to a row, so an odd number of them leaves one on a row of its own, and putting the field that can disappear at the end is what keeps the three pairs above it together whether or not it is shown.

## Creating a patient

- When creating a patient, any field from any section that is set as required when creating a patient appears on the new patient form, including the Billing information fields and the adoption number and marriage licence fields.
- When Sliding fee scale is selected on the new patient form, family size and annual income are required in Billing information, with the same behaviour as on the Details tab. Removing it lifts the requirement there in the same way.
- A field a deployment requires when creating a patient is collected with the other details required at creation rather than in its own section. Family size is collected alongside annual income wherever annual income is required at creation, since annual income cannot be answered without it.
