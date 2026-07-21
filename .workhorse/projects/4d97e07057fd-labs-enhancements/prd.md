# Labs Enhancements

## Overview

A set of enhancements across Tamanu's labs subsystem, compiled from the planned cards in the **Labs ENH** Linear project. This PRD is the brief for our UX/UI designer: each requirement gets its own section, worked through one at a time to add detail. Requirements are ordered by priority.

---

## Priority summary

| # | Original request | Feature | Design work |
|---|------------------|---------|-------------|
| 1 | TAM-2053 | Combined test & panel ordering workflow, with panel contents visible and duplicates prevented | **Yes** — new ordering workflow |
| 2 | _TBC_ | _Awaiting card_ | _TBC_ |
| 3 | TAM-2045 | Specimen type shown next to sample collected date & time | **Minimal** — surface an existing field on the tile |

---

## Requirements

Priority-ordered. Only cards we've talked through are detailed; the rest will be added as we pull them from Linear.

### 1. See the test types within a panel when requesting

**Problem.** Not all clinicians remember by heart which individual test types a panel contains, and the request form never shows a panel's contents. This leaves the clinician unable to confirm that a panel actually covers the tests they need — so they may add individual tests to be safe, or pick the wrong panel without realising. It also means a clinician can add an individual test that a selected panel already includes, producing a double entry (a duplicate request for the same lab result).

**How it works today.** The request type (individual test / panel) is chosen up front via a radio on the first form step, and that choice drives a different selector on the next step. When requesting by panel, the selector shows each panel's name and category but never the individual test types inside it. Because panels and individual tests are selected in separate workflows, a clinician can request an individual test that a chosen panel already covers, with no signal of the overlap.

**Desired behaviour.** The ordering workflow is streamlined so panels and individual tests are requested together, with panel contents visible. Three changes:

1. **Remove the request-type step.** The clinician no longer selects "individual" vs "panel" before choosing tests — both are requested in a single workflow. 
2. **One combined search.** The test-selection search field returns both individual test types and panels, so the clinician finds and adds either from the same place.
   3.  Search results should not include individual tests as part of a panel. Megan to confirm this with Mark. 
4. **Show panel contents.** For a panel, the clinician can see which individual test types make it up while ordering.
5. **Prevent duplicates.** An individual test that is already covered by a panel selected in the same request cannot also be selected on its own — the workflow stops the double entry rather than just warning about it. This check is scoped to the request being built; it does not look at the patient's other active requests.

Once selected, panels and individual tests do not need to be visually distinguished from one another. Detailed interaction and layout are for design.

**Rationale.** Ordering panels and single tests in one workflow removes a decision the clinician shouldn't have to make up front, seeing a panel's constituent tests gives them oversight, and blocking overlapping individual tests eliminates the double entries the request was raised to solve.

**Open questions (to resolve before design):**
- **Panel absorption:** when a clinician selects a panel whose tests are already selected individually, are those individual selections absorbed into the panel?

---

### 3. Show specimen type next to sample collected date & time

**Applies to:** all deployments with the Tamanu–SENAITE integration.

**Problem.** When a sample has the wrong specimen type assigned, it gets sent to SENAITE incorrectly. Lab staff transitioning a request from `Reception pending` to `Results pending` currently can't see the specimen type without opening "View details" on the sample, so they don't reliably check it before transitioning.

**How it works today.** On the lab request view, the "Sample collected" tile shows only the sample date & time. The specimen type is recorded with the sample (alongside collected-by and site) but is only visible via the "View details" modal.

**Desired behaviour.** The specimen type is shown next to the sample collected date & time on the lab request view, so lab staff can check it at a glance before transitioning the request — without opening the sample details modal.

**Rationale / current cost.** Because the specimen type isn't visible up front, wrong assignments slip through to SENAITE. The workaround is for the lab to phone the doctor to cancel and re-order the request so the correct specimen type can be assigned.