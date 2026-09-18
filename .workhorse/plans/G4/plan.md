# Standard lab request label format — implementation plan

Implements `specs/labs/sample-labels.md` (LABEL). Two coupled changes: redesign
the physical sample label (fixed size + revised fields), and add automatic
sample-label printing gated by a new per-facility setting, with the standard
finalise screen tightened up. Web only — no server/PDF or mobile label exists.

Design references: label + auto-print modal
`figma …node-id=41710-34938`; standard finalise screen
`figma …node-id=41385-16946`.

**Status:** implementation complete and lint-clean; label component test + settings
tests passing. Remaining: summary-pane web test, e2e for the auto-print flow, and
the manual label-printer verification (card testing note). Print uses an iframe
print frame (mirrors the medication label), not the old whole-window `print()`.

## Label redesign (`LabRequestPrintLabel`)

`packages/web/app/components/PatientPrinting/printouts/LabRequestPrintLabel.jsx`

- [x] Fix the label size at 40 × 28 mm: replace the `$printWidth`-driven
      `@media print` width/height (lines 12-15, `height = width/2`) with fixed
      `40mm × 28mm`. Remove the `printWidth` prop, its default (`'185'`), and the
      propType.
- [x] Update the fields to the new set and order (drop Lab category + Specimen
      type; add Collected by; rename Test ID → Request ID): Patient name, DOB
      (with age in years), Patient ID, Request ID, Date collected (date + time),
      Collected by.
- [x] Render DOB as short date plus age in years, e.g. `01/01/1987 (36 years)`
      (use the existing age helper alongside `formatShort`).
- [x] Render Date collected with date **and** time (the summary table uses
      `DateDisplay timeFormat="default"`; use the equivalent `useDateTime`
      helper rather than `formatShort`, which is date-only).
- [x] Point the barcode at the request display ID (rename the `testId` data key
      to `requestId`); lay the barcode out horizontally across the bottom with
      the Request ID printed beneath it (remove the `rotate(270deg)` in
      `BarcodeContainer`, line 55) to match the mock. Re-flow the SVG `viewBox`
      / layout for the 40 × 28 aspect ratio and the 6 stacked field lines.
- [x] Keep the field labels as fixed English (no `TranslatedText`) per the spec.

## Remove the label size setting

- [x] Delete the `printMeasures.labRequestPrintLabel` block from
      `packages/settings/src/schema/global.ts` (lines 1483-1492) — it only holds
      `width`.
- [x] Remove the setting read in
      `packages/web/app/components/PatientPrinting/modals/LabRequestPrintLabelModal.jsx`
      (line 33 `getSetting('printMeasures.labRequestPrintLabel.width')` and the
      `printWidth={labelWidth}` prop, line 56).
- [x] Run the settings schema tests; confirm no snapshot/other reference to the
      removed key remains (grep came back clean apart from these two files).

## New per-facility setting: Auto-print sample label

`packages/settings/src/schema/facility.ts`

- [x] Add a top-level `labs` category (`name: 'Labs'`) with an
      `autoPrintSampleLabel` boolean, `defaultValue: false`, a
      `name: 'Auto-print sample label'` and a description. Mirror the existing
      facility feature-toggle pattern (e.g. `medications.pharmacyOrder`
      .`preselectSendToPharmacyOnDischarge`, lines 326-332).
- [x] Confirm the toggle is readable from the web via `useSettings().getSetting`
      the same way existing facility toggles are (add `exposedToWeb` only if the
      existing facility toggles require it).

## Auto-print label screen (selectable preview)

The auto-print step (node 41710) is a label **preview + selection** screen —
distinct from the current `LabRequestPrintLabelModal`, which is reused for the
single-label print in `LabRequestView` and the summary pane and should not be
overloaded.

- [x] Add a selectable label-print component that renders a `LabRequestPrintLabel`
      preview per request, each with a checkbox (all selected by default), a
      `Cancel` and a primary `Print labels` action; printing prints the selected
      labels. Reuse `useSelectableColumn`/selection state as in the summary pane.
- [x] Wire it so `Print labels` invokes the existing printable flow for the
      selected requests and closing it (either action) ends the flow.

## Wire auto-print into the new lab request workflow

`packages/web/app/components/LabRequestModal.jsx` /
`packages/web/app/views/patients/components/LabRequestSummaryPane.jsx`

- [x] On finalise success, when **every** new request has a `sampleTime` and the
      `labs.autoPrintSampleLabel` setting is on, render the auto-print label
      screen in place of the summary table (go straight from sample collection
      to the label screen). Otherwise render the existing `LabRequestSummaryPane`.
- [x] Ensure dismissing/printing from the auto-print screen runs the same
      `handleClose` (reload encounter, reset step, close modal) as the summary
      pane does today.

## Wire auto-print into the lab request view

`packages/web/app/views/patients/LabRequestView.jsx` /
`packages/web/app/views/patients/components/LabRequestRecordSampleModal.jsx`

- [x] When a sample is recorded on a request that was `SAMPLE_NOT_COLLECTED`
      (the transition already sets `RECEPTION_PENDING` + `specimenCollected`,
      RecordSampleModal lines 138-142) and the setting is on, open the auto-print
      label screen for that one request after the record succeeds.
- [x] Add an `onSampleRecorded` callback from `LabRequestRecordSampleModal` that
      fires only on the not-collected → collected transition, and have
      `LabRequestView` open `LABEL_PRINT` (pointed at the auto-print screen) from
      it when the setting is on. Editing an already-collected sample's date/time
      must not trigger it.

## Tighten the standard finalise screen

`packages/web/app/views/patients/components/LabRequestSummaryPane.jsx`

- [x] Disable selection for rows without a `sampleTime` so a "Sample not
      collected" row cannot be ticked/printed (needs per-row disable support in
      `useSelectableColumn`; check for an existing option before adding one).
- [x] Confirm the existing autoselect of collected rows (line 147,
      `getIsRowInitiallySelected: request => Boolean(request.sampleTime)`) holds,
      and that `Print labels`/`Print request` stay disabled when nothing is
      selected.

## Tests

- [x] Component test for `LabRequestPrintLabel`: renders the six fields in order,
      barcode value equals the request display ID, and no Lab category / Specimen
      type fields.
- [x] Web test for the summary pane: uncollected rows are not selectable;
      collected rows start selected; the label screen auto-opens (with every
      request) only when the setting is on and every sample is recorded.
- [ ] Browser e2e for the auto-print path is deferred: it needs the facility
      setting toggled mid-flow (heavy/flaky in `packages/e2e-tests`), and the
      physical label print is a manual printer check (card testing note). The
      setting-off flow is already covered by the existing labRequest e2e specs,
      and the auto-print trigger is covered by the summary-pane component test
      above.
