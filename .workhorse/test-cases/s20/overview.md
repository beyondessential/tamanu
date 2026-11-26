# Test cases: patient ID label on every patient list

Setup: Admin > Translation, set `general.localisedField.displayId.label.short` to "XYZ ID".

- [x] Emergency patients search bar labels the patient ID field "XYZ ID" (automated: `PatientIdSearchFieldLabel.test.jsx`)
- [x] Recently discharged patients search bar labels the patient ID field "XYZ ID" (verifies spec: RDISCH) (automated: `PatientIdSearchFieldLabel.test.jsx`)
- [ ] Emergency patients table heads the patient ID column "XYZ ID"
- [ ] Recently discharged patients table heads the patient ID column "XYZ ID", and the column is still not sortable (verifies spec: RDISCH)
- [ ] With no translation set, both lists show "NHN" in the column and search field
- [ ] All patients, Inpatients and Outpatients still show "XYZ ID"
