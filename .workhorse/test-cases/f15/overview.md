# Edit sample: clearing then re-entering the date

Setup: a lab request with status Reception pending that has Collected by, Specimen type and Site set.

## Edit sample

- [x] Clear the date and time, set it again, leave Collected by, Specimen type and Site blank, then Confirm: View details shows all three blank (automated in `LabRequestRecordSampleModal.test.jsx` and `Labs.test.js`)
- [ ] The same flow, run by hand on a 2.69 build against the original report's steps
- [ ] Control: change only Site, then Confirm: View details shows the new Site and keeps Collected by and Specimen type
- [ ] With specimen type mandated, clearing and re-entering the date then Confirm without a specimen type is blocked by the required-field error
