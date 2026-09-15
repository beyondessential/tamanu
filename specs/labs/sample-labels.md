---
id: LABEL
---

# Lab request sample labels

The sample label is a small printable label attached to a specimen container so
it can be matched back to its lab request. Each label carries the patient and
request identifiers plus a scannable barcode. Staff print labels when a sample
is collected, and can be prompted to print automatically.

One label corresponds to one lab request. A request that records multiple
samples across categories produces one label per lab request.

## Label format

- [ ] The label is a fixed size of 40 × 28 mm.
- [ ] The label displays the following fields, in order:
  - [ ] Patient name
  - [ ] Date of birth, with age in years alongside it
  - [ ] Patient ID
  - [ ] Request ID
  - [ ] Date collected, showing both date and time
  - [ ] Collected by
- [ ] The label shows a barcode encoding the Request ID, with the Request ID
      printed as text beneath it.
- [ ] The field labels are fixed English and are not translated, keeping a
      consistent standard label format across facilities.

## Finalise and print step

After a lab request is finalised, staff reach a print step to print sample
labels and, where offered, the lab request form.

- [ ] The finalise step lists the lab requests just created, each selectable for
      printing.
- [ ] Lab requests whose sample has been recorded as collected are selected by
      default.
- [ ] A lab request whose sample has not been recorded cannot be selected, and
      is shown as sample not collected.
- [ ] Printing labels prints a sample label for each selected lab request.
- [ ] Printing the request prints the full lab request form.

## Automatic sample-label printing

- [ ] When every sample within a request has been recorded, the sample-label
      print screen is presented automatically, moving directly from sample
      collection to the label print screen.
- [ ] The auto-presented print screen shows a preview of each label, all
      selected by default, and prints the selected labels on confirmation.
- [ ] Recording the sample on an existing lab request from the lab request view
      presents the same automatic print screen for that request's label.
- [ ] Automatic printing is triggered only when a sample is first recorded as
      collected. Editing the date or time of an already-collected sample does
      not present the print screen.
- [ ] Once the labels are printed or the screen is dismissed, the flow closes.
- [ ] When not every sample has been recorded, the standard finalise and print
      step is shown instead.

## Configuration

- [ ] Automatic sample-label printing is controlled by a per-facility setting,
      off by default. When it is off, samples are recorded and labels printed
      manually through the finalise and print step.
- [ ] The label size is fixed and not configurable; there is no setting for
      label width or dimensions.
