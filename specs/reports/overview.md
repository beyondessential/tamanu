---
id: REPORTS
---

# Reports

Applies to report definitions, generation, and exports.

## Export file name

- An exported report's file name is `report-<date>-<report name>-<country name>`.
- The name is lowercased, and spaces become dashes, with consecutive dashes collapsed to one.
- This naming applies both to a report downloaded from this facility and to one emailed after running against all facilities, where it also names the zip and appears in the email that delivers it.

### Generic Survey Export

- The Generic Survey Export - Line List report's file name includes the name of the survey being exported, between the report name and the country name: `report-<date>-<report name>-<survey name>-<country name>`.
- The survey name is translated wherever the country name is.

> [!NOTE]
> Every export of this report otherwise carries the same name, so files from different surveys are indistinguishable until opened.

## Metadata tab

- An exported spreadsheet carries a metadata tab listing the report name, the date it was generated, the user who generated it, and the filters it ran with.
- A Generic Survey Export - Line List metadata tab has a Survey row directly after the filters, giving the name of the survey being exported.
