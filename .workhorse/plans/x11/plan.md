# Billing information section on patient details

## Decisions

- Billing information is a new section on the patient details form, below Location information. It holds insurer and insurance policy number (moved from Identification information), insurance plan and patient type (moved from Personal information), plus annual income, family size, Payor 1 and Payor 2, each with its own reference number (Payor 1 reference number, Payor 2 reference number)
- Payor 1 and Payor 2 link to other patient records, stored and searched the same way as mother and father (a patient reference on the patient's additional data, chosen through the patient suggester). Each has its own free-text reference number field beside it
- Family size and annual income are new fields on the patient record, both chosen from dropdowns built from the sliding fee scale setting, the same way as the invoice discount assessment (`InvoiceDiscountAssessmentForm.jsx`): one family size per row of the scale, and annual income as the chosen row's income bands. Family size comes first because the bands depend on it
- Derive the family size options from the number of rows in the sliding fee scale setting, rather than the assessment's hard-coded maximum of 12
- Annual income is stored as the band as displayed, so a band the scale no longer has is still shown as saved on the Details tab
- The invoice discount assessment pre-fills from the patient's saved family size and annual income. Changes made there apply to that invoice only and are not written back to the patient
- Adoption number and marriage licence are new text fields at the end of Identification information

## Open technical questions

- How the Sliding fee scale insurance plan is recognised. Matching on its name is fragile across deployments and translations, so it likely wants a stable identifier (a known plan code, or a setting naming the plan). Settle in tech design
- The conditional requirement belongs in the patient details validation schema, keyed on the selected insurance plans, with its two messages as their own translated strings

