# Labs Enhancements

## Overview

A set of enhancements across Tamanu's labs subsystem, compiled from the planned cards in the **Labs ENH** Linear project. This PRD is the brief for our UX/UI designer: each requirement gets its own section, worked through one at a time to add detail. Requirements are ordered by priority.

## Background: how lab requests work today

Useful context that spans several of the requirements below.

- A lab request is created through a multi-step form supporting three request types: **individual test**, **panel** (a named group of test types), and **superset** (a group of panels).
- Test/panel selection uses a two-pane picker (`TestSelector`): the left pane lists selectable panels or tests with their **category**; the right pane shows the current selection.
- A request moves through: `Sample not collected` → `Reception pending` → `Results pending` → `Interim results` → `To be verified` → `Verified` → `Published`, with side branches for `Cancelled`, `Rejected`, `Invalidated`, `Entered in error`, `Deleted`.
- Results are entered per lab test (free text, number, or select), with reference ranges, then verified and published.

## Requirements

Priority-ordered. Only cards we've talked through are detailed; the rest will be added as we pull them from Linear.

### TAM-2053 — See the test types within a panel when requesting

**Priority:** Highest in the Labs ENH project.

**Requested by:** Palau (originally raised ~2022; re-raised by Bellory, April 2026; Mark Hunt / Lab team, 2024).

**Problem.** Not all clinicians remember by heart which individual test types a panel contains. Because the request form never shows a panel's contents, a clinician can add an individual test that is already included in a panel they've selected — producing a **double entry** (a duplicate request for the same lab result).

**How it works today.** The request type (individual test / panel / superset) is chosen up front via a radio on the first form step, and that choice drives a different selector on the next step. When requesting by panel, the selector shows each panel's name and category but never the individual test types inside it. Because panels and individual tests are selected in separate workflows, a clinician can request an individual test that a chosen panel already covers, with no signal of the overlap.

**Desired behaviour.** The ordering workflow is streamlined so panels and individual tests are requested together, with panel contents visible. Three changes:

1. **Remove the request-type step.** The clinician no longer selects "individual" vs "panel" before choosing tests — both are requested in a single workflow.
2. **One combined search.** The test-selection search field returns both individual test types and panels, so the clinician finds and adds either from the same place.
3. **Show panel contents.** For a panel, the clinician can see which individual test types make it up while ordering.

Detailed interaction and layout are for design.

**Rationale.** Ordering panels and single tests in one workflow removes a decision the clinician shouldn't have to make up front, and seeing a panel's constituent tests gives them oversight to avoid double entries.

**Open questions (to resolve before design):**
- **Superset:** does the third request type (a group of panels) fold into the combined workflow too, or stay as a separate flow?
- **Duplicate handling:** with panels and tests now selectable together, is visibility of panel contents enough, or should the system also actively flag/prevent selecting an individual test that a chosen panel already covers (and vice versa)?
- **Combined results:** how panels and individual tests are distinguished within one search/result list (grouping, labelling), and how a selected panel's constituent tests appear alongside individually-selected tests.
