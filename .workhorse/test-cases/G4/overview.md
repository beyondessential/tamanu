# G4 — Standard lab request label format: manual test plan

Manual scenarios for the standardised lab request sample label and the optional
auto-print-on-collection flow. Verifies spec: LABEL (`specs/labs/sample-labels.md`).

## Preconditions and setup

- [ ] A facility server with the lab module enabled, a test patient, and a user
      who can create lab requests and record samples.
- [ ] Know how to toggle the facility setting **Labs → Auto-print sample label**
      (`labs.autoPrintSampleLabel`) in the admin panel. It is off by default.
- [ ] Have label stock or a PDF printer handy so the print dialog's page size can
      be inspected (label is 40 × 28 mm).

## Label format

- [ ] Open a lab request's sample-label preview and confirm the label renders at a
      fixed 40 × 28 mm and is not resizable — verifies spec: LABEL.
- [ ] Confirm the label shows exactly these fields, in this order: Patient name,
      DOB, Patient ID, Request ID, Date collected, Collected by — verifies spec: LABEL.
- [ ] Confirm DOB shows the date of birth with the patient's age in years
      alongside it, e.g. `01/01/1990 (36 years)` — verifies spec: LABEL.
- [ ] Confirm Date collected shows both the date and the time of collection —
      verifies spec: LABEL.
- [ ] Confirm a barcode is shown encoding the Request ID, with the Request ID
      printed as text beneath the barcode; scanning it returns the Request ID —
      verifies spec: LABEL.
- [ ] For a patient with an unknown/blank date of birth, confirm DOB is empty and
      no age is shown (no `(NaN years)` or stray brackets) — verifies spec: LABEL.
- [ ] Switch the application language away from English and confirm the field
      labels on the label stay in English (fixed standard format) — verifies spec: LABEL.
- [ ] Confirm the label no longer shows Lab category or Specimen type (removed
      from the previous format) — verifies spec: LABEL.

## Finalise and print step — auto-print OFF (default)

- [ ] With the setting off, finalise a new lab request that spans multiple
      categories and confirm the standard "Your lab request has been finalised"
      screen is shown (not the auto print screen) — verifies spec: LABEL.
- [ ] On the finalise screen, confirm rows whose sample has been recorded as
      collected are selected by default — verifies spec: LABEL.
- [ ] Confirm a row whose sample has not been recorded is not selectable (checkbox
      disabled) and its Date & time collected reads "Sample not collected" —
      verifies spec: LABEL.
- [ ] Use the select-all header checkbox and confirm it selects only the rows with
      a recorded sample, skipping uncollected rows — verifies spec: LABEL.
- [ ] With rows selected, click **Print labels** and confirm a sample label prints
      for each selected request, then the finalise summary is still shown
      afterwards — verifies spec: LABEL.
- [ ] Click **Print request** and confirm the full lab request form (not the label)
      is produced for the selected requests — verifies spec: LABEL.
- [ ] Deselect all rows and confirm both **Print labels** and **Print request** are
      disabled.

## Automatic sample-label printing — auto-print ON

- [ ] Enable **Labs → Auto-print sample label** for the facility, then finalise a
      new lab request where every sample is recorded as collected; confirm the
      sample-label print screen is presented automatically, moving straight from
      collection to the print screen (the standard finalise screen is skipped) —
      verifies spec: LABEL.
- [ ] On the auto-presented print screen, confirm a preview of each label is shown,
      all labels are selected by default, and confirming prints the selected labels
      — verifies spec: LABEL.
- [ ] Untick one label on the auto print screen and confirm only the still-ticked
      labels print.
- [ ] Dismiss / close the auto print screen and confirm the flow closes (returns to
      the encounter, not back to a finalise screen) — verifies spec: LABEL.
- [ ] Finalise a request where only some (or no) samples are recorded and confirm
      the standard finalise-and-print screen is shown instead of auto-printing —
      verifies spec: LABEL.
- [ ] From the lab request view, record a sample on an existing request and confirm
      the same automatic print screen is presented for that request's label —
      verifies spec: LABEL.
- [ ] Edit the date or time of an already-collected sample and confirm the print
      screen is NOT presented (auto-print fires only on first collection) —
      verifies spec: LABEL.
- [ ] With the setting on, record a sample and confirm the record-sample modal
      hands off directly to the label print screen without a flash of closing/
      reopening.

## Configuration

- [ ] Confirm the setting is per-facility: enabling it for one facility does not
      change behaviour at another facility on the same server — verifies spec: LABEL.
- [ ] With the setting off (default), confirm recording a sample simply closes the
      modal and the previous manual print workflow is unchanged — verifies spec: LABEL.
- [ ] Confirm there is no label width / dimension setting anywhere in admin
      (`printMeasures.labRequestPrintLabel.width` removed); the label size is fixed
      — verifies spec: LABEL.

## Print output and regression

- [ ] Trigger a label print from a lab request opened behind a modal and confirm
      the print job contains only the label(s) — the app window / modal / patient
      view behind it is not printed.
- [ ] In the print dialog, confirm the page size matches the 40 × 28 mm label stock
      (margins at 0), not A4/Letter.
- [ ] Print a batch with several selected requests and confirm each label lands on
      its own page (one label per page).
- [ ] On the print screen, click Cancel and confirm nothing is sent to the printer
      and the screen closes cleanly without leaving a hidden print frame behind.
