# Search for individual tests in the patient results table

## Notes

### Ordering when a test category is picked

The patient lab test results query (`/:id/labTestResults` in `patientRelations.js`) orders only by test category. When a category is picked, every row shares that category, so the test order is left to the database. It usually comes out alphabetical, but that is not guaranteed. Add the test type name as a secondary sort key so the alphabetical order the spec describes always holds. The flat list with no heading rows and no test category column is already how it works and needs no change.
