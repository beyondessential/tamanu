# Labs Enhancements

## Overview

A set of enhancements across Tamanu's labs subsystem, compiled from the **Upcoming** cards in the **Labs ENH** Linear project. This PRD is the brief for our UX/UI designer: each requirement gets its own section, worked through one at a time to add detail. Requirements are ordered by the priority set in Tamanu (Urgent → High → Medium → No priority); within a tier the order is not yet fixed.

---

## Priority summary

| # | Original request | Feature | Priority | Design work |
|---|------------------|---------|----------|-------------|
| 1 | TAM-2053 | Combined test & panel ordering workflow, with panel contents visible and duplicates prevented | Urgent | **Yes** — new ordering workflow |
| 2 | TAM-4022 | Merge multiple lab requests into a single request | Urgent | **Yes** — request workflow & table display |
| 3 | TAM-6851 | Receive numeric results outside the detection limit | High | _TBC_ |
| 4 | TAM-1888 | Auto-cancel lab requests with no sample collected | High | **None** — backend, opt-in setting |
| 5 | TAM-6938 | Add a "Recollect" lab request status | High | _TBC_ |
| 6 | TAM-2045 | Specimen type shown next to sample collected date & time | High | **Minimal** — surface an existing field on the tile |
| 7 | TAM-6734 | Lab request label format with auto-print prompt | High | **Yes** — label format & print prompt |
| 8 | TAM-6827 | Multiselect status filter on the active requests page | High | **Minimal** — single-select becomes multiselect |
| 9 | TAM-3086 | Default "Collected by" to the current user | Medium | _TBC_ |
| 10 | TAM-3090 | Support a default specimen type for lab tests | Medium | _TBC_ |
| 11 | TAM-3091 | Support a default method for lab tests | Medium | _TBC_ |
| 12 | TAM-6823 | Manage panelOnly lab test types on central | No priority | _TBC_ |
| 13 | TAM-6925 | Add a "Reflex test" visibility status | No priority | _TBC_ |
| 14 | TAM-2045 | Keep test category & types visible while entering sample details | No priority | **Some** — sample entry layout |

---

## Requirements

Priority-ordered. TAM-2053 and TAM-2045 are detailed; the rest are stubs to be worked through one at a time. The `#` here aligns with the priority summary above.

### 1. See the test types within a panel when requesting

**Problem.** Not all clinicians remember by heart which individual test types a panel contains, and the request form never shows a panel's contents. This leaves the clinician unable to confirm that a panel actually covers the tests they need — so they may add individual tests to be safe, or pick the wrong panel without realising. It also means a clinician can add an individual test that a selected panel already includes, producing a double entry (a duplicate request for the same lab result).

**How it works today.** The request type (individual test / panel) is chosen up front via a radio on the first form step, and that choice drives a different selector on the next step. When requesting by panel, the selector shows each panel's name and category but never the individual test types inside it. Because panels and individual tests are selected in separate workflows, a clinician can request an individual test that a chosen panel already covers, with no signal of the overlap.

**Desired behaviour.** The ordering workflow lets clinicians request panels and individual tests together, shows a panel's constituent tests while ordering, and prevents duplicate entries where an individual test and a panel that covers it are both selected in the same request.

**Design updates.**
- **Single ordering workflow.** The up-front "individual vs panel" request-type step is removed — both are requested in one workflow.
- **One combined search.** The test-selection search field returns both individual test types and panels, so the clinician finds and adds either from the same place. Results list matching individual tests first, followed by the panels that contain those tests.
- **Show panel contents.** For a panel, the clinician can see which individual test types make it up while ordering.
- **Prevent duplicates.** Duplicate detection runs in both directions while building a request:
  - An individual test already covered by a selected panel cannot also be selected on its own.
  - Selecting a panel that contains a test already selected individually is likewise detected and resolved.
  - In both cases the workflow stops the double entry rather than just warning about it. This check is scoped to the request being built; it does not look at the patient's other active requests.
- **No visual distinction.** Once selected, panels and individual tests do not need to be visually distinguished from one another. Detailed interaction and layout are for design.

**Rationale.** Ordering panels and single tests in one workflow removes a decision the clinician shouldn't have to make up front, seeing a panel's constituent tests gives them oversight, and blocking overlapping individual tests eliminates the double entries the request was raised to solve.

---

### 2. Merge multiple lab requests into a single request

**Applies to:** all Tamanu deployments — the grouping behaviour works whether or not a deployment has a SENAITE integration. Motivated by the Tamanu–SENAITE (LIMS) integration: driven by Palau, and urgent for the Samoa SENAITE go-live, where high sample volumes (up to ~2,000 samples/day) would otherwise create thousands of separate requests and samples per day if Biochem panels are ordered separately.

**Problem.** Panels that could be run off a single sample are split across separate lab requests, each of which creates its own sample in SENAITE. This multiplies the number of samples the lab must create and track. To run a sample on an interfaced analyser with the correct sample ID, lab users print the lab requests from Tamanu rather than labelling the tube with one SENAITE sample ID — increasing delays, the chance a request isn't run first time, and the risk of the wrong sample ID being used.

**How it works today.** Each panel is requested as its own lab request and maps to its own SENAITE sample, even when several panels share a lab category and could share one sample.

**Desired behaviour.** When panels and individual tests from the **same lab category** are requested together, they are grouped under a single lab request — one test ID, and a single sample (a single SENAITE sample where that integration is in place). Items from different categories remain separate requests. The patient-level results table is unchanged — no work required there.

**Design updates.** Two display patterns recur across the surfaces below:
- **Category grouping** — items grouped by category, each category listing all the tests and panels it contains.
- **Printout layout** — the layout used for the lab results printout: individual tests listed alphabetically first, then each panel under a subheading, with the panel's constituent tests listed in reference-data order.

Applied per surface:

- **New lab request workflow — Sample details step.** Samples are grouped by category, each category's sample listing all the tests and panels it contains (category grouping).
- **New lab request workflow — Finalise modal.** Lists tests and panels the same way, grouped within each category (category grouping).
- **Encounter-level labs table.** No panels column. Hovering over the **Test category** column reveals the tests and panels ordered on the request.
- **Lab request view (encounter level).** Uses the printout layout.
- **Results entry modal.** Uses the printout layout.
- **Active requests table.** Mark is following up on what information lab staff need here. _To be detailed._

**Relationship to requirement 1.** The combined ordering interaction — one search across panels and tests, seeing a panel's contents, and preventing duplicates — is specified in requirement 1. This requirement covers how the resulting panels and individual tests are grouped under one request and sample, and how they are displayed.

**Rationale.** Fewer requests and samples per patient reduces load on the integration and the manual tracking burden, and lets the lab label one tube with one SENAITE sample ID rather than reconciling several printed requests.

**Open questions (to resolve before design):**
- **Reflex test display:** should a panel-only reflex test (e.g. urine microscopy under urinalysis) appear under its panel subheading, while an individual reflex test (e.g. LDL when triglycerides are high) appears in the alphabetical individual tests list? Depends on the reflex visibility work in requirement 13.

_To be detailed._

---

### 3. Receive numeric results outside the detection limit

**Summary.** SENAITE sometimes reports that a value fell outside the detection limit, e.g. `< 0.3` (the lowest detectable value is 0.3 and the real result is below it). Tamanu should display the `< 0.3` value wherever the result is shown, while still applying reference-range validation so the result flags as out of range.

_To be detailed._

---

### 4. Auto-cancel lab requests with no sample collected

**Problem.** Lab requests left in "Sample not collected" accumulate indefinitely, inflating the active lab request backlog. When lab reference data is updated, a large backlog overloads the API and causes integration delays — Palau reached 900+ uncollected requests, Nauru ~80. Raised by Palau and Nauru.

**How it works today.** A lab request stays in "Sample not collected" until someone records a sample or cancels it manually; nothing clears stale uncollected requests, so they persist as active requests. Manual cancellation transitions the request to "Cancelled" with a chosen cancellation reason (from the configurable lab cancellation reasons) and an accompanying note.

**Desired behaviour.** A facility can opt in to automatically cancelling lab requests that have sat in "Sample not collected" beyond a configurable age. A periodic background process on central transitions requests past the threshold to "Cancelled", the same end state as a manual cancellation.

- **Opt-in, per facility.** Disabled by default and enabled per facility, with the age threshold configured per facility.
- **Dedicated reason.** Auto-cancelled requests carry a dedicated, system-reserved cancellation reason — "Sample not collected — auto-cancelled" — separate from the user-configurable manual reasons, plus an accompanying note, so they are distinguishable in the request log from manually cancelled requests.

**Rationale.** Clearing stale uncollected requests keeps active lab request volume down, avoiding the API overload and integration delays a large backlog causes when reference data is updated.

**Open questions (to resolve before design):**
- **Threshold basis, unit, and default:** measured from the request's requested date (time spent uncollected), expressed in what unit, and with what default once a facility enables it? To be determined.

---

### 5. Add a "Recollect" lab request status

**Summary.** Add a new "Recollect" lab request status. Lab staff transition to it when a sample is unsuitable for testing, signalling the requesting doctor to organise a new sample. For LIMS-integrated instances, it pairs with a "Cancelled" diagnostic report carrying a PDF rejection report so the doctor can see why the sample was rejected.

**Context.** A `Rejected` status already exists but is integration-driven and terminal: a SENAITE rejection arrives as a FHIR DiagnosticReport with status `cancelled`, which materialises the request to `Rejected`. `Rejected` is excluded from the change-status options, so it is not staff-settable and gives the doctor no actionable signal to recollect. "Recollect" is intended as the actionable counterpart.

**Open questions (to resolve before design):**
- **Relationship to "Rejected":** for LIMS instances, when SENAITE rejects a sample (DiagnosticReport `cancelled` + rejection PDF), should the request land in "Recollect" instead of "Rejected" — making Recollect the new home for LIMS rejections — or does "Rejected" stay as-is with "Recollect" a separate, manually-set status alongside it?
- **Lifecycle:** is "Recollect" an active, recoverable status — does the doctor act by recording a new sample on the same request (transitioning it back toward Reception pending) or by creating a brand-new request — or is it terminal like "Rejected"?

_To be detailed._

---

### 6. Show specimen type next to sample collected date & time

**Applies to:** all deployments with the Tamanu–SENAITE integration.

**Problem.** When a sample has the wrong specimen type assigned, it gets sent to SENAITE incorrectly. Lab staff transitioning a request from `Reception pending` to `Results pending` currently can't see the specimen type without opening "View details" on the sample, so they don't reliably check it before transitioning.

**How it works today.** On the lab request view, the "Sample collected" tile shows only the sample date & time. The specimen type is recorded with the sample (alongside collected-by and site) but is only visible via the "View details" modal.

**Desired behaviour.** The specimen type is shown next to the sample collected date & time on the lab request view, so lab staff can check it at a glance before transitioning the request — without opening the sample details modal.

**Design updates.**
- On the "Sample collected" tile, the recorded specimen type appears as a secondary line beneath the sample collected date & time — a bare value with no label, since the tile is already labelled "Sample collected".
- When no sample has been collected, the tile keeps its existing appearance (the date placeholder only); no specimen type line is added.

**Rationale / current cost.** Because the specimen type isn't visible up front, wrong assignments slip through to SENAITE. The workaround is for the lab to phone the doctor to cancel and re-order the request so the correct specimen type can be assigned.

---

### 7. Lab request label format with auto-print prompt

**Summary.** Standardise the lab request label format and automatically prompt to print labels, minimising manual errors when handling samples. Initial request from Nauru; applies to all countries and projects using the lab module.

**Context.** The label (`LabRequestPrintLabel`) is an SVG with fixed fields — Patient Name, Patient ID, DOB, Test ID, Date collected, Lab category, Specimen type — plus a Test ID barcode; field labels are hardcoded English and the width is a setting. Printing is fully manual: after finalising a request, the "Request finalised" summary pane lists requests with checkboxes and "Print label" / "Print request" buttons, with no prompt.

**Desired behaviour.** The lab request label follows a standard format. When a sample is recorded, the sample label is presented for printing automatically — configurable per facility and off by default — so staff no longer have to remember to print it manually.

**Design updates — standard label.**
- **Size:** 40 × 28 mm.
- **Fields:**
  - Patient name
  - Patient date of birth
  - MRN / Tamanu patient ID
  - Lab request ID, with a barcode encoding it
  - Collection date & time
  - Collector's name or initials

**Design updates — auto-print and finalise flow.**
- **Trigger.** When a sample is recorded — via the new lab request workflow or via the lab request view — the print sample label displays automatically once the sample is recorded.
- **Configurable, off by default.** Enabled per facility and disabled by default. When disabled, the current workflows apply unchanged.
- **Finalise screen when recording a new lab request:**
  - If no sample is recorded, the finalise screen displays (as now).
  - If a sample is recorded, the finalise screen displays only when there are outstanding requests whose sample has not been collected.

---

### 8. Multiselect status filter on the active requests page

**Problem.** Lab staff managing collections alternate between "Sample not collected" and "Reception pending" but can only filter on one status at a time, so they can't see both groups together.

**How it works today.** The active lab requests search bar has a single-select "Status" field offering the active statuses (terminal and published statuses are excluded from the options). The listing endpoint already accepts multiple statuses (`status in (:statuses)`), so the constraint is only in the single-select control.

**Desired behaviour.** The "Status" filter on the active lab requests listing accepts multiple statuses at once, so staff can view combinations such as "Sample not collected" and "Reception pending" together. With no status selected, all active statuses show, as now. The selectable set stays the active statuses.

**Design updates.**
- The single-select Status dropdown becomes a multiselect, following the existing multiselect field pattern — selected statuses shown as removable chips.

**Rationale.** Seeing the statuses they alternate between in one view removes the constant re-filtering while managing collections.

---

### 9. Default "Collected by" to the current user

**Summary.** Default the "Collected by" field to the current user when recording lab sample details, across both collect-sample workflows (recording at request creation, and recording later). Desktop is the priority; mobile may be split into a separate card.

_To be detailed._

---

### 10. Support a default specimen type for lab tests

**Summary.** Support setting a default specimen type against individual lab test types and panels, via a new `specimenType` reference-data column on both, applied when recording samples. Desktop is the priority; mobile may be split into a separate card.

_To be detailed._

---

### 11. Support a default method for lab tests

**Summary.** Support a default "Method" for lab tests to reduce data entry, where staff currently pick a method from the full list for each result. Needed for phase 3 of the integration. Raised by FSM and Nauru.

_To be detailed._

---

### 12. Manage panelOnly lab test types on central

**Summary.** Allow managing `panelOnly` lab test types on central so integration codes can be updated easily. Small differences between a Tamanu code and a SENAITE keyword (e.g. capitalisation) stop results transmitting to Tamanu. Applies to all deployments.

_To be detailed._

---

### 13. Add a "Reflex test" visibility status

**Summary.** Add a "Reflex test" visibility status for lab test types that can't be ordered in Tamanu but must exist in reference data so they can be attached to a request when a LIMS sends results back. Without the test in ref data, SENAITE errors and no results publish. These tests are currently given the PanelOnly visibility status as a workaround.

_To be detailed._

---

### 14. Keep test category and test types visible while entering sample details

**Summary.** Lab staff feedback on TAM-2045: when recording sample details they can't see which request they're working on, so they sometimes enter the wrong specimen type. They asked to move the sample details entry box higher so the request's test category and test types stay in view while they select the specimen type, making it clear which request it is.

**Problem.** At the point of entering sample details, the test category and test types aren't visible alongside the entry fields, so staff can't easily confirm which request they're recording against before choosing the specimen type.

**Desired behaviour.** The request's test category and test types are visible while entering sample details, so staff can confirm the request and select the correct specimen type. This complements requirement 6, which surfaces the recorded specimen type on the read-only tile; this one keeps the test context visible at the point of entry.

**Open questions (to resolve before design):**
- **Surface:** which entry point does this target — the "Record sample details" modal (which today shows no test information), the Sample details step of the new request workflow, or the lab request view layout? The change differs by surface.

_To be detailed._