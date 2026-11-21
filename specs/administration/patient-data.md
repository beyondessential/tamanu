---
id: PTDATA
---

# Patient data import and export

Applies to the Patient data view in the admin panel, through which administrators bring existing patient records into Tamanu and take them out; configuration data is imported and exported through the reference data view instead.

## Data types

- The Patient data view offers two data types: administered vaccines and patients
- Patients and administered vaccines appear only in the Patient data view, not in the reference data import or export
- The view opens on the import tab, and every data type is selected by default on both tabs

## Import

- An administrator uploads a spreadsheet and selects which data types to import; each data type is read from its own sheet, named after the data type
- A test import validates the spreadsheet and reports what would be created, updated, skipped and errored, without saving anything
- An import saves all of its rows or none of them: any error rolls the whole import back, and each error is listed with its sheet and row
- Rows refer to reference data, users, locations and departments that already exist in Tamanu
- A patient row carries every field held on the patient's additional data, including the [billing fields](../patient/details.md), under a column named after the field
- An imported annual income is stored as the spreadsheet gives it, without being checked against the sliding fee scale, so a band the scale no longer covers imports the same way it displays
- When patients and administered vaccines are imported together, the patients are saved first so that the vaccines can refer to them
- Importing a data type requires the create and write permissions on it (`Patient`, `AdministeredVaccine`)

## Export

- An administrator selects which data types to export and downloads a spreadsheet with one sheet per data type
- Exporting a data type requires the list permission on it
- An export larger than the configured maximum export file size fails, with a message to export fewer data types

## Provisioning

- Provisioning a server from a reference data file also imports any patient and administered vaccine sheets in that file
