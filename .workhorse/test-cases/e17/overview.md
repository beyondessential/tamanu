# Survey name in Generic Survey export

Scenarios for the survey name in the Generic Survey Export - Line List file name and metadata tab, on both the download and emailed paths.

## Downloaded from this facility

- [ ] Exporting the Generic Survey Export for a survey gives a file named `report-<date>-generic-survey-export-line-list-<survey name>-<country name>` (verifies spec: REPORTS)
- [ ] The metadata tab has a Survey row with the survey's name directly after Filters, before Timezone, and Filters still shows the survey ID (verifies spec: REPORTS)
- [ ] With a translation for the survey in the current language, the file name and Survey row use the translated name (verifies spec: REPORTS)
- [ ] Another report's file name and metadata tab are unchanged, with no Survey row (verifies spec: REPORTS)

## Emailed after running against all facilities

- [x] The emailed file and zip are named with the survey name between the report name and the country name (verifies spec: REPORTS)
- [x] The metadata tab has a Survey row with the survey's name directly after Filters (verifies spec: REPORTS)
- [x] Another report's file name and metadata tab are unchanged, with no Survey row (verifies spec: REPORTS)
- [x] A survey that can't be found falls back to the name without a survey, so a failure email still sends
