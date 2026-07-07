# Labs Enhancements

## Overview

A set of enhancements across Tamanu's labs subsystem, compiled from the planned cards in the **Labs ENH** Linear project. This PRD is the brief for our UX/UI designer: each requirement gets its own section, worked through one at a time to add detail. Requirements are ordered by priority.

## Priority summary

| # | Card | Feature | Priority | Design work | Status |
|---|------|---------|----------|-------------|--------|
| 1 | TAM-2053 | Combined test & panel ordering workflow, with panel contents visible and duplicates prevented | Highest | **Yes** — new ordering workflow | Detailed — 1 open question |
| 2 | _TBC_ | _Awaiting card_ | Second | _TBC_ | Not yet added |
| 3 | TAM-2045 | Specimen type shown next to sample collected date & time | Third | **Minimal** — surface an existing field on the tile | Detailed |
| 4 | TAM-1888 | Auto-cancel lab requests left in "Sample not collected", with a per-project timeframe | High | **No** — backend + a per-project setting | Detailed — open questions |

**Design work key:**
- **Yes** — needs design work: new screens, flows, or components for the designer to produce.
- **Minimal** — small UI change (e.g. surfacing an existing field); light or no dedicated design needed.
- **No** — no design work; developer can implement from the requirement directly.

**Status key:**
- **Detailed** — requirement talked through and written up; any remaining gaps noted as open questions.
- **Not yet added** — card identified but not yet worked through.

## Background: how lab requests work today

Useful context that spans several of the requirements below.

- A lab request is created through a multi-step form supporting three request types: **individual test**, **panel** (a named group of test types), and **superset** (a group of panels).
- Test/panel selection uses a two-pane picker (`TestSelector`): the left pane lists selectable panels or tests with their **category**; the right pane shows the current selection.
- A request moves through: `Sample not collected` → `Reception pending` → `Results pending` → `Interim results` → `To be verified` → `Verified` → `Published`, with side branches for `Cancelled`, `Rejected`, `Invalidated`, `Entered in error`, `Deleted`.
- Results are entered per lab test (free text, number, or select), with reference ranges, then verified and published.

## Requirements

Priority-ordered. Only cards we've talked through are detailed; the rest will be added as we pull them from Linear.

### 1. TAM-2053 — See the test types within a panel when requesting

**Priority:** Highest in the Labs ENH project.

**Requested by:** Palau (originally raised ~2022; re-raised by Bellory, April 2026; Mark Hunt / Lab team, 2024).

**Problem.** Not all clinicians remember by heart which individual test types a panel contains. Because the request form never shows a panel's contents, a clinician can add an individual test that is already included in a panel they've selected — producing a **double entry** (a duplicate request for the same lab result).

**How it works today.** The request type (individual test / panel / superset) is chosen up front via a radio on the first form step, and that choice drives a different selector on the next step. When requesting by panel, the selector shows each panel's name and category but never the individual test types inside it. Because panels and individual tests are selected in separate workflows, a clinician can request an individual test that a chosen panel already covers, with no signal of the overlap.

**Desired behaviour.** The ordering workflow is streamlined so panels and individual tests are requested together, with panel contents visible. Three changes:

1. **Remove the request-type step.** The clinician no longer selects "individual" vs "panel" before choosing tests — both are requested in a single workflow. The **superset** request type stays separate for now.
2. **One combined search.** The test-selection search field returns both individual test types and panels, so the clinician finds and adds either from the same place.
3. **Show panel contents.** For a panel, the clinician can see which individual test types make it up while ordering.
4. **Prevent duplicates.** An individual test that is already covered by a selected panel cannot also be selected on its own — the workflow stops the double entry rather than just warning about it.

Once selected, panels and individual tests do not need to be visually distinguished from one another. Detailed interaction and layout are for design.

**Rationale.** Ordering panels and single tests in one workflow removes a decision the clinician shouldn't have to make up front, seeing a panel's constituent tests gives them oversight, and blocking overlapping individual tests eliminates the double entries the request was raised to solve.

**Open questions (to resolve before design):**
- **Duplicate scope & direction:** does "already covered by a selected panel" apply only within the request being built, or also against active requests already ordered for the patient? And when a clinician selects a panel whose tests are already selected individually, are those individual selections absorbed into the panel?

### 3. TAM-2045 — Show specimen type next to sample collected date & time

**Priority:** Third highest in the Labs ENH project.

**Applies to:** all deployments with the Tamanu–SENAITE integration.

**Problem.** When a sample has the wrong specimen type assigned, it gets sent to SENAITE incorrectly. Lab staff transitioning a request from `Reception pending` to `Results pending` currently can't see the specimen type without opening "View details" on the sample, so they don't reliably check it before transitioning.

**How it works today.** On the lab request view, the "Sample collected" tile shows only the sample date & time. The specimen type is recorded with the sample (alongside collected-by and site) but is only visible via the "View details" modal.

**Desired behaviour.** The specimen type is shown next to the sample collected date & time on the lab request view, so lab staff can check it at a glance before transitioning the request — without opening the sample details modal.

**Rationale / current cost.** Because the specimen type isn't visible up front, wrong assignments slip through to SENAITE. The workaround is for the lab to phone the doctor to cancel and re-order the request so the correct specimen type can be assigned.

### 4. TAM-1888 — Auto-cancel lab requests with no sample collected

**Priority:** Fourth (High).

**Requested by:** Palau and Nauru.

**Problem.** Lab requests that never have a sample collected pile up in the `Sample not collected` status — Palau has over 900, Nauru nearly 800. This large pool of active requests overloads the API, especially after lab reference-data updates trigger mass re-materialisation, causing integration delays with SENAITE. The backlog grows over time, so API optimisations alone won't keep pace.

**How it works today.** Requests stay in `Sample not collected` indefinitely until someone cancels them. Cancellation sets the status to `Cancelled` with a reason and an accompanying note. There is no automatic clean-up.

**Desired behaviour.** The system automatically cancels lab requests that have been left in `Sample not collected` (no sample details entered) beyond a configurable age. Each project can set its own cancellation timeframe (e.g. 24, 48, 72 hours). Auto-cancellation is an option a project enables.

**Rationale / current cost.** Palau and Nauru don't have capacity to check daily whether each request has had a sample collected. The current workarounds are on-call developers running mass cancellations, and carefully managing reference-data updates to limit integration delays.

**Open questions (to resolve before build):**
- **Timeframe origin & config shape:** is the age measured from request creation (request date & time)? Is the timeframe a free numeric value (hours/days) or a fixed set of options (24/48/72)? Confirm it's a per-facility/global setting with a per-project enable toggle.
- **Identifiability:** should auto-cancelled requests carry a distinct cancellation reason (and note) so they're distinguishable from manually cancelled ones in the record and reporting?
- **Scope of what's cancelled:** only requests still in `Sample not collected` — confirm no other active statuses are ever auto-cancelled.
- **Timezone basis:** the age cut-off is evaluated against the primary timezone / facility timezone (relevant to what "after 24 hours" means across facilities).