# Invoice receipt patient labels

Verifies spec: INVPRT, receipt labels.

- [ ] On a facility using the receipt layout, with no translations of its own for the patient fields, the receipt's patient details read **Date of birth** and **Patient ID**
- [ ] The A4 printout of the same invoice also reads **Patient ID**
- [ ] With a translation set for the patient ID's short name (`general.localisedField.displayId.label.short`, e.g. NHN), the receipt shows that name, as the A4 does
- [ ] With only the long name translated (`general.localisedField.displayId.label`), the receipt shows the long name
- [ ] With a translation set for the date of birth's short name (`general.localisedField.dateOfBirth.label.short`, e.g. DOB), the receipt shows that name
- [ ] Translating `general.patientId.label` changes the receipt's default patient ID label
