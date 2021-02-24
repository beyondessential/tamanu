# Programs module

## Importing surveys

A survey definition has four parts:
- a `Program`: a named group of surveys
- a `Survey`: a named collection of questions
- a list of questions (each stored as a pair of records, one ProgramDataElement 
and one SurveyScreenComponent)

The surveys are defined in spreadsheets (just xlsx files). We're tracking the
details of the different columns in those spreadsheets and their valid values
in [this google spreadsheet](https://docs.google.com/spreadsheets/d/1qwfw1AOED7WiElOCJwt_VHo_JaDhr6ZIiJMqjRCXajQ/edit#gid=1797422705).

Currently it's the LAN server's responsibility to import survey definition 
spreadsheets, pending a proper admin interface on the sync server. The LAN server
importer doesn't actually touch the LAN database at all - it's purely a tool for
parsing an xslx into a series of SurveyScreenComponent and ProgramDataElement records,
and immediately syncing those records up to the sync server without any additional
logic.

A sample web request to import a survey definition is as follows. Note that the
`file` parameter isn't uploading a file at all, it's just a path to the file 
_on the LAN server's local filesystem_. As this is intended as a dev-only tool,
it's assumed that the LAN server will just be running on your local development
machine.

```
###
POST http://localhost:4000/v1/admin/importSurvey
Content-Type: application/json

{
  "file": "/mnt/m/beyond/documents/CVD.Primary.Screening.Form.xlsx",
  "programName": "CVD",
  "programCode": "CVD-Fiji",
  "surveyName": "CVD Primary Screening Form",
  "surveyCode": "CVD-Risk-Fiji",
  "dryRun": false
}
```

- `programCode` and `surveyCode` are treated as unique identifiers for those
objects respectively; they will be created if they don't exist, or the name updated
if they do
- `dryRun`, if true, will just `console.log` out the created records instead of
sending them to the sync server
- records will be sent to the sync server defined in `config.sync.host` (edit
config/default.json to change or config/local.json to temporarily override)
- note that this will **NOT** delete any records. removing a question from an
xlsx will just stop it importing in future. to delete a record you'll need to 
get its ID and send a DELETE request to the sync server manually
