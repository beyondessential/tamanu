# Alternative identification number search

## Automated (facility server, PatientSearchAdditionalFields.test.js)

- [ ] Finds a patient by birth certificate (verifies spec: PSRCH)
- [ ] Finds a patient by driving licence (verifies spec: PSRCH)
- [ ] Finds a patient by passport number (verifies spec: PSRCH)
- [ ] Finds a patient by insurance policy number (verifies spec: PSRCH)
- [ ] Matches the start of a number, ignoring case (verifies spec: PSRCH)
- [ ] Does not match the middle of a number (verifies spec: PSRCH)
- [ ] Does not match NHN or unrelated fields such as contact number (verifies spec: PSRCH)
- [ ] Combines with other search fields (verifies spec: PSRCH)

## Manual

- [ ] Open All patients, expand the advanced fields, and see "Alternative identification number" (verifies spec: PSRCH)
- [ ] Search a passport number from a patient's Identification information and get that patient (verifies spec: PSRCH)
- [ ] The first row of advanced fields keeps its layout, with the new field starting the second row
- [ ] Clearing the search clears the field and its results
