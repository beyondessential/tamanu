# Generated file names for reports and IPS QR codes

File names built from a report definition's name, the country name or a patient's display name stay a single file name inside the folder they are written to.

## Automated

- [x] A report name and country containing `/`, `\`, `..` or a null byte produce a report file name with no path separators or null bytes, inside the output folder
- [x] An ordinary report name is still dashed and lower-cased (`report-<date>-weekly-admissions-utopia`)
- [x] The file-name helper strips separators, characters invalid in file names, control characters, and leading and trailing dots and whitespace, and keeps dots within a name
- [x] Two runs of the same report each write their zip to a folder of their own, and the folder is removed afterwards
- [x] Exporting a report version from the admin panel still produces the same dashed file name

## Manual

- [ ] Run a scheduled report whose definition name contains a `/` and emailed to a recipient: the zip arrives, and its name has the `/` removed
- [ ] Request an IPS for a patient whose display name contains a `/`: the email arrives with the QR code attached, named with the patient's display ID and without the `/`
