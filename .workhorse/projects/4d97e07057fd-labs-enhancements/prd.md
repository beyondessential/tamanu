# Labs Enhancements

## Overview

A set of enhancements across Tamanu's labs subsystem, compiled from the **Upcoming** cards in the **Labs ENH** Linear project. This PRD is the brief for our UX/UI designer: each requirement gets its own section, worked through one at a time to add detail. Requirements are ordered by the priority set in Tamanu (Urgent → High → Medium → No priority); within a tier the order is not yet fixed.

---

## Priority summary

| # | Original request | Feature | Priority | Design work |
|---|------------------|---------|----------|-------------|
| 1 | [TAM-2053](https://linear.app/bes/issue/TAM-2053) | Combined test & panel ordering workflow, with panel contents visible and duplicates prevented | Urgent | **Yes** — new ordering workflow |
| 2 | [TAM-4022](https://linear.app/bes/issue/TAM-4022) | Merge multiple lab requests into a single request | Urgent | **Yes** — request workflow & table display |
| 3 | [TAM-6851](https://linear.app/bes/issue/TAM-6851) | Receive numeric results outside the detection limit | High | _TBC_ |
| 4 | [TAM-6938](https://linear.app/bes/issue/TAM-6938) | Add a "Recollect" lab request status | High | **Yes** — status, notification, listing |
| 5 | [TAM-2045](https://linear.app/bes/issue/TAM-2045) | Specimen type shown next to sample collected date & time | High | **Minimal** — surface an existing field on the tile |
| 6 | [TAM-6734](https://linear.app/bes/issue/TAM-6734) | Lab request label format with auto-print prompt | High | **Yes** — label format & print prompt |
| 7 | [TAM-6827](https://linear.app/bes/issue/TAM-6827) | Multiselect status filter on the active requests page | High | **Minimal** — single-select becomes multiselect |
| 8 | [TAM-3086](https://linear.app/bes/issue/TAM-3086) | Default "Collected by" to the current user | Medium | **None** — field default |
| 9 | [TAM-3090](https://linear.app/bes/issue/TAM-3090) | Support a default specimen type for lab tests | Medium | _TBC_ |
| 10 | [TAM-6823](https://linear.app/bes/issue/TAM-6823) | Manage panelOnly lab test types on central | No priority | _TBC_ |
| 11 | [TAM-6925](https://linear.app/bes/issue/TAM-6925) | Add a "Reflex test" visibility status | No priority | _TBC_ |
| 12 | [TAM-2045](https://linear.app/bes/issue/TAM-2045) | Keep test category & types visible while entering sample details | No priority | **Some** — sample entry layout |
| 13 | [TAM-1888](https://linear.app/bes/issue/TAM-1888) | Auto-cancel lab requests with no sample collected | No priority | **None** — backend, opt-in setting |

---

## Requirements

Priority-ordered. TAM-2053 and TAM-2045 are detailed; the rest are stubs to be worked through one at a time. The `#` here aligns with the priority summary above.

### 1. See the test types within a panel when requesting

**Problem.** Not all clinicians remember by heart which individual test types a panel contains, and the request form never shows a panel's contents. This leaves the clinician unable to confirm that a panel actually covers the tests they need — so they may add individual tests to be safe, or pick the wrong panel without realising. It also means a clinician can add an individual test that a selected panel already includes, producing a double entry (a duplicate request for the same lab result).

**How it works today.** The request type (individual test / panel) is chosen up front via a radio on the first form step, and that choice drives a different selector on the next step. When requesting by panel, the selector shows each panel's name and category but never the individual test types inside it. Because panels and individual tests are selected in separate workflows, a clinician can request an individual test that a chosen panel already covers, with no signal of the overlap.

**Desired behaviour.** The ordering workflow lets clinicians request panels and individual tests together, shows a panel's constituent tests while ordering, and prevents duplicate entries where an individual test and a panel that covers it are both selected in the same request.

**Design updates.**

Figma link - https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41338-21844&t=tyhjuqgTUSzOAZGg-1

- Tests and panels should be combined in the list and ordered alphabetically by category. 
- Tests within a panel should be listed in the same order as they appear in the reference data.
- Search should follow the existing test/panel behaviour which uses real-time search.
  -  Search results should not prioritise category grouping, but instead order tests by most relevant result. It will be an edge case, but this may mean we sometimes display the same category header more than once. 
  - If a user searches an individual test, display the test first followed by any panels that contain that test alphabetically. 
- Default all panel dropdowns as closed, even when searching for an individual test which is contained in a panel. 
- Once selected, tests and panels should be displayed in the selected section and grouped by category.
  - Categories should be displayed in alphabetical order and within the category panels and tests should be displayed in combined alphabetical order. 
- Remove the current validation behavior when no tests have been selected yet but the user tries to click next. And instead just disable the 'Next' button until one item has been selected
- Duplicate prevention:
  - If a panel has been selected the individual tests within that panel cannot then be selected. See design with disabled checkbox and tooltip on hover.
  - If the user selects an individual test, they CAN select a panel containing that test however we want to automatically deselect the individual test they originally selected.
  - Multiple panels containing the same individual test can be ordered and no duplicate warning will be displayed.
      - If a lab request contains multiple panels with the same individual test, is it possible for SENAITE to send the same result back to each of these individual tests? And also only display the result once within the patient result table (e.g. don't display the same result with 2 different timestamps)? 
- Remove the current validation behavior when no tests have been selected yet but the user tries to click next. And instead just disable the 'Next' button until one item has been selected.
  
---

### 2. Merge multiple lab requests into a single request

**Problem.** Panels that could be run off a single sample are split across separate lab requests, each of which creates its own sample in SENAITE. This multiplies the number of samples the lab must create and track. To run a sample on an interfaced analyser with the correct sample ID, lab users print the lab requests from Tamanu rather than labelling the tube with one SENAITE sample ID — increasing delays, the chance a request isn't run first time, and the risk of the wrong sample ID being used.

**How it works today.** Each panel is requested as its own lab request and maps to its own SENAITE sample, even when several panels share a lab category and could share one sample.

**Desired behaviour.** When panels and individual tests from the **same lab category** are requested together, they are grouped under a single lab request — one test ID, and a single sample (a single SENAITE sample where that integration is in place). Items from different categories remain separate requests. The patient-level results table is unchanged — no work required there.

**Design updates.**
- **New lab request workflow:**
  - **Sample details step.** Samples are grouped by category, each category's sample listing all the tests and panels it contains in alphabetical order (category grouping). https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41385-16442&t=tyhjuqgTUSzOAZGg-1
  - **Finalised modal.** Lists tests and panels the same way, grouped within each category alphabetically (category grouping). Please auto-select checkboxes for categories that have had the samples recorded. Please note other UI design updates to this modal. https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41385-16946&t=tyhjuqgTUSzOAZGg-1
- **Encounter-level labs table**:
  - Remove panel column.
  - Update 'Test category' column title to 'Category'.
  - Hovering over the 'Test category' column reveals the tests and panels ordered on the request. https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=12440-113980&t=tyhjuqgTUSzOAZGg-1
- **Lab request view (encounter level):**
  - Update the table so that it can handle displaying results for both individual tests and panels.
  - Display panels first alphabetically, with individual tests listed in same order as reference data.
  - Display individual tests first alphabetically after panels.
      - This should include reflex tests added by SENAITE whether or not they're intended as an individual test or as part of a panel. 
  - Please also update the tile 'Test category' to 'Category'. https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41639-15551&t=tyhjuqgTUSzOAZGg-1
- **Results entry modal:**
  - Use same layout as lab request view. https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41830-319441&t=tyhjuqgTUSzOAZGg-1
- **Active requests table and Published request table:**
  - Remove the Panel column.
  - Add the tooltip on hover of the test category to display the tests within it.
  - Update column and search from 'Test category' to 'Category' https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=37455-2394&t=tyhjuqgTUSzOAZGg-1

---

### 3. Receive numeric results outside the detection limit

**Summary.** SENAITE sometimes reports that a value fell outside the detection limit, e.g. `< 0.3` (the lowest detectable value is 0.3 and the real result is below it). Tamanu should display the `< 0.3` value wherever the result is shown, while still applying reference-range validation so the result flags as out of range.

**Desired behaviour.** Support displaying a result such as `< 0.3`, while still applying reference-range validation so the result flags as out of range.

**For refinement discussion.**
- Any other considerations to be made with this change - reporting?

---

### 4. Add a "Recollect" lab request status

**Summary.** Add a new "Recollect" lab request status. Lab staff transition to it when a sample is unsuitable for testing, signalling the requesting doctor to organise a new sample. For LIMS-integrated instances, it pairs with a "Cancelled" diagnostic report carrying a PDF rejection report so the doctor can see why the sample was rejected.

**Context.** A `Rejected` status already exists but is integration-driven and terminal: a SENAITE rejection arrives as a FHIR DiagnosticReport with status `cancelled`, which materialises the request to `Rejected`. `Rejected` is excluded from the change-status options, so it is not staff-settable and gives the doctor no actionable signal to recollect. "Recollect" is intended as the actionable counterpart.

**Desired behaviour.** Lab staff set a request to "Recollect" when a sample is unsuitable for testing.

- **Staff-settable.** "Recollect" is offered as an option when changing a request's status.
- **Notify the requesting clinician.** Moving a request to "Recollect" raises an in-app notification to the requesting clinician. Opening the notification takes them to the lab request view for the request needing recollection.
- **Recollection is a new request.** From that view the clinician generates a new lab request; the original "Recollect" request is not re-collected or reopened.
- **Listing.** Requests in "Recollect" appear in the Published lab requests table (alongside the completed statuses), not the active requests table.

**Open questions (to resolve before design):**
- **Relationship to "Rejected" for LIMS instances:** when SENAITE rejects a sample (DiagnosticReport `cancelled` + rejection PDF), should the request land in "Recollect" instead of "Rejected" — making Recollect the home for LIMS rejections — or does "Rejected" stay as-is with "Recollect" a separate, manually-set status alongside it?
- **Published table label/grouping:** Recollect requests are listed in the Published lab requests table, which is labelled "Published" and today shows completed requests — confirm whether the label or status grouping needs adjusting so a Recollect request doesn't read oddly there.
- **Rejection report handling:** for LIMS instances the recollection is accompanied by a "Cancelled" diagnostic report with a PDF rejection report — clarify how that report is received, stored, and surfaced to the clinician on a Recollect request (e.g. where it is viewed and whether it is attached to the notification or the lab request view).
- **Print action label:** on a Recollect request the printable document is a rejection report rather than results, so decide what the "Print results" label should be re-titled to in this context.

---

### 5. Show specimen type next to sample collected date & time on lab request view

**Problem.** When a sample has the wrong specimen type assigned, it gets sent to SENAITE incorrectly. Lab staff transitioning a request from `Reception pending` to `Results pending` currently can't see the specimen type without opening "View details" on the sample, so they don't reliably check it before transitioning.

**How it works today.** On the lab request view, the "Sample collected" tile shows only the sample date & time. The specimen type is recorded with the sample (alongside collected-by and site) but is only visible via the "View details" modal.

**Desired behaviour.** The specimen type is shown next to the sample collected date & time on the lab request view, so lab staff can check it at a glance before transitioning the request — without opening the sample details modal.

**Design updates.**
- On the "Sample collected" tile, the recorded specimen type appears as a secondary line beneath the sample collected date & time — a bare value with no label, since the tile is already labelled "Sample collected". https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41709-33336&t=tyhjuqgTUSzOAZGg-1
- When no sample has been collected, the tile keeps its existing appearance (the date placeholder only); no specimen type line is added.
- Keep responsive behaviour of all tiles when additional lines of data are added to a tile - the titles should all be aligned.
- Please adjust the width of the 5 tiles so that date and time of sample collected fit on one line for 13inch screens. Currently it's flowing onto two lines but theres enough room for it to sit on the one.

---

### 6. Lab request label format with auto-print prompt

**Summary.** Standardise the lab request label format and automatically prompt to print labels, minimising manual errors when handling samples. Initial request from Nauru; applies to all countries and projects using the lab module.

**Context.** The label (`LabRequestPrintLabel`) is an SVG with fixed fields — Patient Name, Patient ID, DOB, Test ID, Date collected, Lab category, Specimen type — plus a Test ID barcode; field labels are hardcoded English and the width is a setting. Printing is fully manual: after finalising a request, the "Request finalised" summary pane lists requests with checkboxes and "Print label" / "Print request" buttons, with no prompt.

**Desired behaviour.** The lab request label follows a standard format. When a sample is recorded, the sample label is presented for printing automatically — configurable per facility and off by default — so staff no longer have to remember to print it manually.

**Design updates.**
- **Update standard label size and details:**
  - **Size:** 40 × 28 mm.
  - **Fields:**
      - Patient name
      - DOB
      - Patient ID
      - Request ID, with a barcode encoding it
      - Date collected
      - Collected by

- **Auto-print and finalise flow.**

  - https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41710-34938&t=tyhjuqgTUSzOAZGg-1
  - **Trigger.** When all samples within a request are recorded — via the new lab request workflow or via the lab request view — the print sample label displays automatically once the sample is recorded.
      - Configurable, off by default. Enabled per facility and disabled by default. When disabled, the current workflows apply unchanged.
              - Category: Labs
              - Feature: Auto-print sample label
  - Finalise screen when not all samples have been recorded:
      - If no sample is recorded or only partial samples are recorded, the default standard finalise screen displays.
      - Samples recorded as collected should be autoselected on the finalise modal.  https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41385-16946&t=tyhjuqgTUSzOAZGg-1
    
---

### 7. Multiselect status filter on the active requests page

**Problem.** Lab staff managing collections alternate between "Sample not collected" and "Reception pending" but can only filter on one status at a time, so they can't see both groups together.

**How it works today.** The active lab requests search bar has a single-select "Status" field offering the active statuses (terminal and published statuses are excluded from the options). The listing endpoint already accepts multiple statuses (`status in (:statuses)`), so the constraint is only in the single-select control.

**Desired behaviour.** The "Status" filter on the active lab requests listing accepts multiple statuses at once, so staff can view combinations such as "Sample not collected" and "Reception pending" together. With no status selected, all active statuses show, as now. The selectable set stays the active statuses.

**Design updates.**
- The single-select 'Status' dropdown becomes a multiselect, following the existing multiselect field pattern — selected statuses shown as removable chips.

---

### 8. Default "Collected by" to the current user

**Problem.** When recording lab sample details, staff must pick the collector from the practitioner list every time, even though it is almost always the logged-in user.

**How it works today.** "Collected by" starts empty in both collect-sample workflows — the Sample details step when recording at request creation, and the record-sample modal when recording later — and is enabled once a sample time is entered.

**Desired behaviour.** "Collected by" defaults to the current user when recording a sample, both when recording sample as collected during the lab request workflow or via the lab request view. The default remains editable so staff can select a different collector, and it only applies when no collector is already recorded — editing a sample that already has a collector keeps the existing value.

**Scope.** Desktop. Mobile may follow as a separate card.

---

### 9. Support a default specimen type for lab tests categories

**Summary.** Support setting a default specimen type against 'Lab Test Category', via a new `defaultSpecimenType` reference-data column, applied when recording samples. Desktop is the priority; mobile may be split into a separate card.

**Desired behaviour.** Add new column to 'Lab Test Category' to support setting a default specimen type. 

- If a category has a default specimen type set, the specimen type should be defaulted for each lab request generated under this category.
  - If a default is set, the field should still be editable. 
- If no default specimen type is set for a category, the field should be blank when recording a sample for that category. 

**Scope.** Desktop. Mobile may follow as a separate card.

---

### 10. Manage panelOnly lab test types on central

**Summary.** Lab test types with a visibility status of 'panelOnly' are not listed in the 'Manage' table for lab test types reference data, meaning they can only be managed via export and reimport. We would like to allow managing `panelOnly` lab test types on central so integration codes can be updated easily. Small differences between a Tamanu code and a SENAITE keyword (e.g. capitalisation) stop results transmitting to Tamanu. 

**Desired behaviour.** 
- List tests with a visibility status of 'panelOnly' in the lab test type manage tab on the admin panel.
- Add 'Panel only' as an option to the visibilityStatus select field when managing a single lab test via the admin panel. 

---

### 11. Add a "Reflex test" visibility status

**Summary.** Add a "Reflex test" visibility status for lab test types that can't be ordered in Tamanu but must exist in reference data so they can be attached to a request when a LIMS sends results back. Without the test in ref data, SENAITE errors and no results publish. These tests are currently given the PanelOnly visibility status as a workaround.

**Desired behaviour.**

- Add new visibility status to lab test types `reflexTest` .
  - Tests with this status are not able to be ordered as an individual test.
  - Tests with this status are not able to be added to a panel. 
- What other considerations are there for SENAITE integration here? Check with Rohan if needed. 

---

### 12. Update the Sample taken modal when recording a sample from the lab request view

**Summary.** Update the current modal so it is the same modal that appears during a new lab request. However please keep modal header as is 'Record sample details' https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=41385-16442&t=tyhjuqgTUSzOAZGg-1

---

### 13. Autocancel uncollected lab requests

_To be detailed._
testing adding a new link google.com