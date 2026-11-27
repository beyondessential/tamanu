# Plan

## Context

The card was written against v2.64. Since then the labs epic (#10894, 30 Sep 2026) replaced lab label printing wholesale:

- Lab labels print from `LabRequestLabelPrintFrame`, an off-screen same-origin iframe, so the app behind the modal no longer prints and no labels are dropped.
- The label is a fixed 40 × 28 mm, `@page` is sized to it, and each label is its own page. `printMeasures.labRequestPrintLabel` and the dead `printWidth` default are gone. The LABEL spec already records the fixed size.
- #10757 landed: BaseModal hides its header under `@media print`.
- Every `printable` modal now passes its own `onPrint`, so BaseModal's fallback to `print()` on the app window has no callers.
- The 40 × 28 mm one-per-page output has been verified on real label hardware.

What is left is a refactor with no behaviour change, so no spec change.

## Decisions

- Scope is a refactor only: a shared label print frame, plus removing BaseModal's window-print fallback.
- No spec change. The print-output guarantee (only labels, one per page) is not added to the LABEL spec.
- BaseModal keeps both `printable` and `onPrint`. `printable` still shows the print button, `onPrint` becomes required alongside it, and the fallback branch is deleted. No call sites change.
- BaseModal's `@media print` rules stay. They still apply when someone prints the app window with the browser's own print command.
- The shared frame takes the page size as props, because medication labels get theirs from settings (`useLabelDimensions`) and lab labels from a constant (`LAB_LABEL_DIMENSIONS`).
- `MedicationLabelPrintFrame` and `LabRequestLabelPrintFrame` stay as thin named wrappers, so call sites, the imperative `print()` handle and the `data-testid`s are unchanged.

## Checklist

- [ ] Add `PatientPrinting/printouts/LabelPrintFrame.jsx`: the off-screen iframe, document adoption (callback ref plus the `load` re-adopt), `FrameStyles` with `@page` from `width`/`height` props, one `LabelPage` per child, and the `print()` handle resolving on `afterprint`. Carry the medication frame's explanatory comments across once, here.
- [ ] Give the frame `width`, `height`, `children` (one element per label) and a `data-testid` prop. Throw a not-ready error that names the frame generically.
- [ ] Reduce `MedicationLabelPrintFrame` to a wrapper: read dimensions from `useLabelDimensions`, render a `MedicationLabel` per label keyed `label.id || index`, and forward the ref.
- [ ] Reduce `LabRequestLabelPrintFrame` to a wrapper: `LAB_LABEL_DIMENSIONS`, a `LabRequestPrintLabel` per label keyed `label.requestId || index`, and forward the ref.
- [ ] BaseModal: delete the `print()` fallback in `handlePrint`, document `onPrint` as required when `printable` is set, and assert on it rather than silently doing nothing.
- [ ] Check every `printable` caller still passes `onPrint` (`git grep -ln printable -- packages/web/app`), including `HandoverNotesButton` → `HandoverNotesModal`.
- [ ] Run the web unit tests touching the frames (`LabRequestSummaryPane.test.jsx`, the medication label tests) and lint the changed files.
- [ ] Print by hand from each entry point in a browser to confirm the output is unchanged (see test cases).
