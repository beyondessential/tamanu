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

**Requested by:** Palau (originally raised ~2022; re-raised by Bellory, April 2026; Mark Hunt / Lab team, 2024).

**Problem.** Not all clinicians remember by heart which individual test types a panel contains. Because the request form never shows a panel's contents, a clinician can add an individual test that is already included in a panel they've selected — producing a **double entry** (a duplicate request for the same lab result).

**How it works today.** When requesting by panel, the selector shows each panel's name and category but never the individual test types inside it. There is no signal that an individually-selected test overlaps with a selected panel.

**Desired behaviour.** The individual test types within a panel are visible to the clinician while building a lab request, so they can avoid requesting a test that a chosen panel already covers. Detailed interaction and layout can be filled in during design.

**Open questions (to resolve before design):**
- Scope: is this purely *making panel contents visible* (clinician self-corrects), or should the system also *actively flag or prevent* a duplicate when an individual test overlaps with a selected panel?
- Where the clinician most needs to see panel contents: while browsing panels (to choose), after selecting (to confirm), or both.
- Does this extend to the **superset** request type (panels within a superset, and the tests within those), and to the **individual** type (surfacing which panel(s) a test belongs to)?
