# Search for individual tests in the patient results table

## Notes

### Table when only a test category is picked

The patient lab test results query (`/:id/labTestResults` in `patientRelations.js`) returns a flat list for a category, ordered only by category, and the table shows it with a test category column hidden. This changes to the same grouped layout as picked tests and panels: the category's panels the patient has a published lab request ordered under, each with its tests, then the category's remaining tests under "Individual tests". The grouping and ordering logic can be shared with the picked view, with the category view working out its own panels and individual tests before handing over.

### Category scoping the Test or panel suggestions

The Test or panel suggester takes the picked category as an extra query parameter and filters on the configured category: the panel's own category for panels, and the test type's category for tests. The table's category filter keeps matching on the lab request's category, as it does today. These usually agree, but a test whose type sits in a different category from its request shows in the category table without being suggested under that category.
