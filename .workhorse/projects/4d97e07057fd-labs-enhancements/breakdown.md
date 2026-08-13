# Labs Enhancements card breakdown

Cards derived from the 13 requirements in the PRD.

## One lab request per category

Change the fan-out rule so a submission produces one lab request per lab test category, each holding multiple panels and individual tests, rather than one request per panel. Covers the model change away from a single `labTestPanelRequestId`, the migration, and the SENAITE sample mapping so a merged request maps to a single sample. Backend only, with no new UI. Open question to resolve with Rohan: whether SENAITE can return the same result to two panels that share a test, and how that result is shown once rather than twice in the patient results table.

## Combined test and panel selector

Replace the up-front individual/panel radio with a single list combining tests and panels, grouped by category alphabetically, with panel contents visible and collapsed by default. Includes the search ordering rules, the grouped selected section, and duplicate prevention: tests inside a selected panel become unselectable with a tooltip, and selecting a panel auto-deselects an individual test it covers. Also replaces the empty-selection validation message with a disabled Next button.

## Sample details step grouped by category

Rework the sample details step so samples are grouped by category, each listing the tests and panels it contains alphabetically. The same modal is reused when recording a sample from the lab request view, keeping the existing Record sample details header there.

## Finalise modal with category grouping and auto-selected samples

Update the request finalised modal to list tests and panels grouped within each category alphabetically, auto-select the checkboxes for categories whose samples have been recorded, and apply the other UI updates in the design. Covers the finalise-modal requirements that appear in both PRD requirement 2 and requirement 6.

## Lab request view results table for panels and tests

Update the lab request view table to display results for both individual tests and panels, with panels first alphabetically and their tests in reference data order, followed by individual tests alphabetically. Includes reflex tests added by SENAITE, and renames the tile label from Test category to Category.

## Results entry modal matching the lab request view

Bring the results entry modal onto the same layout as the lab request view results table. The modal is a separate component from the lab request view table, so the layout work is not shared between them.

## Category column and test tooltip on lab request listings

Across the encounter-level labs table, the active requests table and the published requests table: remove the Panel column, rename Test category to Category in both column and search, and show the request's tests and panels on hover over the category.

## Standard lab request label format

Standardise the label to 40 by 28 mm carrying patient name, DOB, patient ID, request ID with a barcode encoding it, date collected, and collected by.

## Auto-print the sample label when a sample is recorded

Present the sample label for printing automatically once all samples in a request are recorded, from either the new workflow or the lab request view. Controlled by a per-facility setting under a new Labs category, off by default, leaving existing workflows unchanged when disabled.

## Specimen type on the sample collected tile

Show the recorded specimen type as an unlabelled secondary line beneath the sample collected date and time on the lab request view, with no line shown when no sample has been collected. Includes keeping tile titles aligned as tiles grow and widening the five tiles so the collected date and time fit on one line on a 13 inch screen.

## Multiselect status filter on active lab requests

Turn the single-select Status filter on the active lab requests listing into a multiselect following the existing chip-based pattern, so staff can view combinations such as Sample not collected and Reception pending together. The listing endpoint already accepts multiple statuses, so the change is confined to the control.

## Default Collected by to the current user

Default the Collected by field to the logged-in user when recording a sample, in both the request workflow and the lab request view. The default stays editable and applies only when no collector is already recorded. Desktop only.

## Mobile — default Collected by to the current user

Mobile follow-up to defaulting Collected by. Default the Collected by field to the logged-in user when recording a lab sample on mobile, keeping it editable and applying only when no collector is already recorded. Split from the desktop card, which the PRD scopes to desktop with mobile to follow.

## Default specimen type per lab test category

Add a `defaultSpecimenType` column to the Lab Test Category reference data, applied as the specimen type when recording a sample for a request in that category. The field stays editable, and is blank where the category has no default. Desktop only.

## Mobile — default specimen type per lab test category

Mobile follow-up to the default specimen type per category. Apply the category's `defaultSpecimenType` as the specimen type when recording a lab sample on mobile, keeping it editable and blank where the category has no default. Split from the desktop card, which the PRD scopes to desktop with mobile to follow.

## Numeric results outside the detection limit

Display results SENAITE reports as outside the detection limit, such as `< 0.3`, wherever the result is shown, while still applying reference range validation so the result flags as out of range. Needs a decision on reporting implications before it is built.

## Manage panelOnly lab test types on central

List lab test types with a `panelOnly` visibility status in the lab test type manage tab, and add Panel only to the visibility status select when managing a single test, so integration codes can be corrected without an export and reimport.

## Reflex test visibility status

Add a `reflexTest` visibility status for lab test types that cannot be ordered individually or added to a panel, but must exist in reference data so a LIMS can attach results to a request. Replaces the current workaround of giving these tests `panelOnly`. Open SENAITE considerations to confirm with Rohan.

## Auto-cancel uncollected lab requests

Automatically cancel lab requests where no sample has been collected, as an opt-in setting. Backend only. Not yet detailed in the PRD.

## Recollect lab request status

Add a staff-settable Recollect status for samples unsuitable for testing, notifying the requesting clinician and listing the request in the published table. Four open questions are recorded against this requirement in the PRD and need resolving during the card's interview. The load-bearing one is whether LIMS rejections should land in Recollect rather than Rejected, which determines whether this is a new status or a change to the existing integration mapping.