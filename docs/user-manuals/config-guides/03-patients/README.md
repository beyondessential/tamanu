# 3. Patients

Patient registration and details, identifiers, custom patient fields, patient history, search,
printing, deaths, merging and importing patients, the patient portal and the AI patient summary.

These guides step system administrators through setting up how patients are registered and recorded in
Tamanu. Patient records sit beneath almost every other module, so they are usually configured first.

If it is your first time setting up patient records in Tamanu, read the
[Patients Module Implementation Guide](https://beyond-essential.slab.com/topics/patients-module-e8qnu52c) first.

| # | Guide | Covers |
| --- | --- | --- |
| 3.1 | [Reference data](01-reference-data.md) | Patient details lists, secondary ID types, the address hierarchy, custom patient fields, patient history lists, the patient import sheet, and the hard coded values patient fields accept |
| 3.2 | [Settings](02-settings.md) | Mandatory, hidden and default patient fields, display IDs, search, layout, printing, deaths, the patient portal and the AI patient summary, and the automated duplicate check and discharge on death |
| 3.3 | [Permissions](03-permissions.md) | Finding, registering and editing patients, patient history, deaths, patient resources, the patient portal and AI summary, and patient merge |

---

## Desktop and mobile

Patients are registered and their details recorded on both desktop and mobile, but some patient
features are desktop only:

- Editing a display ID
- The linked address hierarchy fields
- Default values for patient fields
- The duplicate patient check when registering a patient
- Registering a birth
- Recording a death
- The **Ongoing conditions**, **Allergies**, **Family history** and **Care plans** sections in the
  patient sidebar. **Other patient issues** are also recorded on mobile
- **Patient resources**, for printing ID cards, labels and certificates
- The patient portal registration and form options
- The AI patient summary

Registering patients and editing their details on mobile can each be turned off. See
[Tamanu Mobile](02-settings.md#tamanu-mobile).
