# Test cases

A refactor with no intended behaviour change. These cases confirm that printing labels and printable modals works the same as before.

## Lab request sample labels (verifies spec: LABEL)

- [ ] Print labels from the lab request view's print label modal: the print preview shows only the selected labels, one per 40 × 28 mm page, and none of the app behind the modal.
- [ ] Print more than a dozen labels in one go: every selected label appears, one per page.
- [ ] Print labels from the finalise and print step's Print labels button: only the selected requests' labels print.
- [ ] With automatic sample-label printing on, record every sample: the auto-presented screen prints every label and closes once the print dialog is dismissed.
- [ ] Labels render in Roboto, with the barcode and field labels matching the on-screen preview.
- [ ] With the interface in another language, the label's field labels print translated.

## Medication labels

- [ ] Print medication labels: one label per page, sized to the configured label dimensions, and nothing else from the app.
- [ ] Change the medication label dimension settings: the printed page size follows them.

## Printable modals

- [ ] Each printable modal's print button still prints its document (e.g. encounter record, lab results printout, handover notes).
- [ ] A modal given `printable` without `onPrint` fails loudly in development rather than printing the app window.

## Automated

- [ ] Unit test for the shared label frame: it portals one page per label into the frame document, and `print()` resolves on the frame's `afterprint`.
- [ ] Existing `LabRequestSummaryPane` and medication label tests pass unchanged.
