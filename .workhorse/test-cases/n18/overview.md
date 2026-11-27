# Test cases

A refactor with no intended behaviour change. These cases confirm that printing labels and printable modals works the same as before.

Test Cases 1 to 6 refer to the browser regression run posted as comments on the card: each flow was driven in Chrome against a rig at this branch and a rig at main, with print intercepted and the captured frame printed to PDF to measure its pages. Both gave the same output.

## Lab request sample labels (verifies spec: LABEL)

- [x] Print labels from the lab request view's print label modal: the print preview shows only the selected labels, one per 40 × 28 mm page, and none of the app behind the modal. (Test Case 1)
- [x] Print more than a dozen labels in one go: every selected label appears, one per page. (Test Case 3, 14 labels)
- [x] Print labels from the finalise and print step's Print labels button: only the selected requests' labels print. (Test Case 4)
- [x] With automatic sample-label printing on, record every sample: the auto-presented screen prints every label and closes once the print dialog is dismissed. (Test Cases 2 and 3)
- [ ] Labels render in Roboto, with the barcode and field labels matching the on-screen preview.
- [ ] With the interface in another language, the label's field labels print translated.

## Medication labels

- [x] Print medication labels: one label per page, sized to the configured label dimensions, and nothing else from the app. (Test Case 5)
- [ ] Change the medication label dimension settings: the printed page size follows them.

## Printable modals

- [ ] Each printable modal's print button still prints its document (e.g. encounter record, lab results printout, handover notes).
- [x] A modal given `printable` without `onPrint` refuses to render rather than printing the app window (`BaseModalPrint.test.jsx`).
- [x] The print button calls `onPrint` with no arguments and never prints the app window (`BaseModalPrint.test.jsx`).

## Automated

- [x] Unit test for the shared label frame: it portals one page per label into the frame document and none into the app, and `print()` prints the frame and resolves on its `afterprint` (`LabelPrintFrame.test.jsx`).
- [x] Unmounting the frame removes its labels cleanly (`LabelPrintFrame.test.jsx`, through test cleanup).
- [x] Empty children (`null`, `false`) print no blank label (`LabelPrintFrame.test.jsx`).
- [x] The printed page size follows the frame's width and height. Not testable in jsdom, where the test build of styled-components writes no global styles, so this rests on the manual print checks above. Measured in the browser regression run: 40 × 28 mm lab pages and 80 × 40 mm medication pages.
- [x] Existing `LabRequestSummaryPane` and medication label tests pass unchanged.
- [x] E2E: printing a label from the lab request view prints one label page holding the request ID, from the label frame and not the app window (`tests/patients/labRequest.spec.ts`).
- [x] E2E: dispensing and printing a medication label prints one label page holding the patient's name, from the label frame and not the app window (`tests/medication/medication.spec.ts`).
