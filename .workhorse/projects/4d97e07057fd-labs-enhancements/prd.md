# Labs Enhancements

## Overview

A set of enhancements across Tamanu's labs subsystem, compiled from the **Upcoming** cards in the **Labs ENH** Linear project. This PRD is the brief for our UX/UI designer: each requirement gets its own section, worked through one at a time to add detail. Requirements are ordered by the priority set in Tamanu (Urgent → High → Medium → No priority); within a tier the order is not yet fixed.

---

## Priority summary

| # | Original request | Feature | Priority | Design work |
|---|------------------|---------|----------|-------------|
| 1 | TAM-4022 | Merge multiple lab requests into a single request | Urgent | **Yes** — request workflow & table display |
| 2 | TAM-2053 | Combined test & panel ordering workflow, with panel contents visible and duplicates prevented | Urgent | **Yes** — new ordering workflow |
| 3 | TAM-6851 | Receive numeric results outside the detection limit | High | _TBC_ |
| 4 | TAM-1888 | Auto-cancel lab requests with no sample collected | High | _TBC_ |
| 5 | TAM-6938 | Add a "Recollect" lab request status | High | _TBC_ |
| 6 | TAM-4421 | Retain search parameters across logout/login | High | _TBC_ |
| 7 | TAM-2045 | Specimen type shown next to sample collected date & time | High | **Minimal** — surface an existing field on the tile |
| 8 | TAM-6734 | Lab request label format with auto-print prompt | High | _TBC_ |
| 9 | TAM-6827 | Multiselect status filter on the active requests page | High | _TBC_ |
| 10 | TAM-3086 | Default "Collected by" to the current user | Medium | _TBC_ |
| 11 | TAM-3090 | Support a default specimen type for lab tests | Medium | _TBC_ |
| 12 | TAM-3091 | Support a default method for lab tests | Medium | _TBC_ |
| 13 | TAM-2018 | Blood bank workflow | Medium | _TBC_ |
| 14 | TAM-6823 | Manage panelOnly lab test types on central | No priority | _TBC_ |
| 15 | TAM-6925 | Add a "Reflex test" visibility status | No priority | _TBC_ |

---

## Requirements

Priority-ordered. TAM-2053 and TAM-2045 are detailed; the rest are stubs to be worked through one at a time. The `#` here aligns with the priority summary above.

### 1. Merge multiple lab requests into a single request

**Applies to:** deployments with the Tamanu–SENAITE (LIMS) integration. Driven by Palau, and urgent for the Samoa SENAITE go-live, where high sample volumes (up to ~2,000 samples/day) would otherwise create thousands of separate requests and samples per day if Biochem panels are ordered separately.

**Problem.** Panels that could be run off a single sample are split across separate lab requests, each of which creates its own sample in SENAITE. This multiplies the number of samples the lab must create and track. To run a sample on an interfaced analyser with the correct sample ID, lab users print the lab requests from Tamanu rather than labelling the tube with one SENAITE sample ID — increasing delays, the chance a request isn't run first time, and the risk of the wrong sample ID being used.

**How it works today.** Each panel is requested as its own lab request and maps to its own SENAITE sample, even when several panels share a lab category and could share one sample.

**Desired behaviour.** When panels and individual tests from the **same lab category** are requested together, they are grouped under a single lab request — one test ID, and a single SENAITE sample. Items from different categories remain separate requests.

- The lab request view shows the full list of tests across the grouped panels and individual tests.
- The Active Lab Requests table shows the panels and tests on the request.
- The patient results table still supports filtering by panel.

**Design — new lab request workflow.**
- On the **Sample details** step, samples are grouped by category, with each category's sample listing all the tests and panels it contains.
- The **Finalise** modal lists tests and panels the same way, grouped within each category.

**Relationship to requirement 2.** The combined ordering interaction — one search across panels and tests, seeing a panel's contents, and preventing duplicates — is specified in requirement 2. This requirement covers how the resulting panels and individual tests are grouped under one request and sample, and how they are displayed.

**Rationale.** Fewer requests and samples per patient reduces load on the integration and the manual tracking burden, and lets the lab label one tube with one SENAITE sample ID rather than reconciling several printed requests.

**Open questions (to resolve before design):**
- **Display grouping:** within a merged request, are tests shown as one flat list, or grouped under panel headings? The card's refinement note says a flat list; Mark's later comments ask for panel grouping to support reflex display.
- **Reflex test display:** should a panel-only reflex test (e.g. urine microscopy under urinalysis) appear under its panel heading, while an individual reflex test (e.g. LDL when triglycerides are high) appears at the bottom of the request? Depends on the reflex visibility work in requirement 15.

_To be detailed._

---

### 2. See the test types within a panel when requesting

**Problem.** Not all clinicians remember by heart which individual test types a panel contains, and the request form never shows a panel's contents. This leaves the clinician unable to confirm that a panel actually covers the tests they need — so they may add individual tests to be safe, or pick the wrong panel without realising. It also means a clinician can add an individual test that a selected panel already includes, producing a double entry (a duplicate request for the same lab result).

**How it works today.** The request type (individual test / panel) is chosen up front via a radio on the first form step, and that choice drives a different selector on the next step. When requesting by panel, the selector shows each panel's name and category but never the individual test types inside it. Because panels and individual tests are selected in separate workflows, a clinician can request an individual test that a chosen panel already covers, with no signal of the overlap.

**Desired behaviour.** The ordering workflow is streamlined so panels and individual tests are requested together, with panel contents visible. Four changes:

1. **Remove the request-type step.** The clinician no longer selects "individual" vs "panel" before choosing tests — both are requested in a single workflow.
2. **One combined search.** The test-selection search field returns both individual test types and panels, so the clinician finds and adds either from the same place.
3. **Show panel contents.** For a panel, the clinician can see which individual test types make it up while ordering.
4. **Prevent duplicates.** An individual test that is already covered by a panel selected in the same request cannot also be selected on its own — the workflow stops the double entry rather than just warning about it. This check is scoped to the request being built; it does not look at the patient's other active requests.

Once selected, panels and individual tests do not need to be visually distinguished from one another. Detailed interaction and layout are for design.

**Rationale.** Ordering panels and single tests in one workflow removes a decision the clinician shouldn't have to make up front, seeing a panel's constituent tests gives them oversight, and blocking overlapping individual tests eliminates the double entries the request was raised to solve.

**Open questions (to resolve before design):**
- **Panel absorption:** when a clinician selects a panel whose tests are already selected individually, are those individual selections absorbed into the panel?
- **Search results and panel members:** should search results exclude individual tests that are members of a panel? Megan to confirm with Mark.

---

### 3. Receive numeric results outside the detection limit

**Summary.** SENAITE sometimes reports that a value fell outside the detection limit, e.g. `< 0.3` (the lowest detectable value is 0.3 and the real result is below it). Tamanu should display the `< 0.3` value wherever the result is shown, while still applying reference-range validation so the result flags as out of range.

_To be detailed._

---

### 4. Auto-cancel lab requests with no sample collected

**Summary.** Automatically cancel lab requests left in "Sample not collected" beyond a threshold, to reduce the volume of active lab requests. A large backlog of uncollected requests overloads the API after lab reference data is updated, causing integration delays (Palau had 900+ such requests, Nauru ~80). Raised by Palau and Nauru.

_To be detailed._

---

### 5. Add a "Recollect" lab request status

**Summary.** Add a new "Recollect" lab request status. Lab staff transition to it when a sample is unsuitable for testing, signalling the requesting doctor to organise a new sample. For LIMS-integrated instances, it pairs with a "Cancelled" diagnostic report carrying a PDF rejection report so the doctor can see why the sample was rejected.

_To be detailed._

---

### 6. Retain search parameters across logout/login

**Summary.** Regression from v2.51: search parameters are no longer retained across logout/login on the Active Labs, Outpatient, and Imaging search pages (worked in v2.50). Parameters are still retained when navigating away and back within the same session — the issue is specific to logout/login. Restore retention.

_To be detailed._

---

### 7. Show specimen type next to sample collected date & time

**Applies to:** all deployments with the Tamanu–SENAITE integration.

**Problem.** When a sample has the wrong specimen type assigned, it gets sent to SENAITE incorrectly. Lab staff transitioning a request from `Reception pending` to `Results pending` currently can't see the specimen type without opening "View details" on the sample, so they don't reliably check it before transitioning.

**How it works today.** On the lab request view, the "Sample collected" tile shows only the sample date & time. The specimen type is recorded with the sample (alongside collected-by and site) but is only visible via the "View details" modal.

**Desired behaviour.** The specimen type is shown next to the sample collected date & time on the lab request view, so lab staff can check it at a glance before transitioning the request — without opening the sample details modal.

**Rationale / current cost.** Because the specimen type isn't visible up front, wrong assignments slip through to SENAITE. The workaround is for the lab to phone the doctor to cancel and re-order the request so the correct specimen type can be assigned.

---

### 8. Lab request label format with auto-print prompt

**Summary.** Standardise the lab request label format and automatically prompt to print labels, minimising manual errors when handling samples. Initial request from Nauru; applies to all countries and projects using the lab module.

_To be detailed._

---

### 9. Multiselect status filter on the active requests page

**Summary.** Make the "Status" search field on the active lab requests page multiselect, so lab staff can view "Sample not collected" and "Reception pending" together. Today these two statuses (which lab staff alternate between while managing collections) can only be filtered one at a time.

_To be detailed._

---

### 10. Default "Collected by" to the current user

**Summary.** Default the "Collected by" field to the current user when recording lab sample details, across both collect-sample workflows (recording at request creation, and recording later). Desktop is the priority; mobile may be split into a separate card.

_To be detailed._

---

### 11. Support a default specimen type for lab tests

**Summary.** Support setting a default specimen type against individual lab test types and panels, via a new `specimenType` reference-data column on both, applied when recording samples. Desktop is the priority; mobile may be split into a separate card.

_To be detailed._

---

### 12. Support a default method for lab tests

**Summary.** Support a default "Method" for lab tests to reduce data entry, where staff currently pick a method from the full list for each result. Needed for phase 3 of the integration. Raised by FSM and Nauru.

_To be detailed._

---

### 13. Blood bank workflow

**Summary.** Streamline blood bank testing — reduce paper forms and speed up cross-match testing. Raised by FSM, with other deployments expected to use it.

_To be detailed._

---

### 14. Manage panelOnly lab test types on central

**Summary.** Allow managing `panelOnly` lab test types on central so integration codes can be updated easily. Small differences between a Tamanu code and a SENAITE keyword (e.g. capitalisation) stop results transmitting to Tamanu. Applies to all deployments.

_To be detailed._

---

### 15. Add a "Reflex test" visibility status

**Summary.** Add a "Reflex test" visibility status for lab test types that can't be ordered in Tamanu but must exist in reference data so they can be attached to a request when a LIMS sends results back. Without the test in ref data, SENAITE errors and no results publish. These tests are currently given the PanelOnly visibility status as a workaround.

_To be detailed._