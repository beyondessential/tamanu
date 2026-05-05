# TAM-3993 — Program form edit on desktop (shared requirements)

**Linear:** TAM-3993 — *Support ability to edit a program form submission on desktop*

This file holds **requirements shared** by child work. Feature-specific UI and acceptance criteria live in the child specs.

## Child specs

- **@llm/specs/TAM-3993/TAM-3992.md** — Editing a form & viewing edited form  
- **@llm/specs/TAM-3993/TAM-3996.md** — Viewing change log (overflow, API contract details, presentation rules)

---

## Persistence & data model

- Edits update the **same** `survey_responses` and `survey_response_answers` rows (no new response row for an edit).
- **Original submission time** stays in `survey_responses.end_time` (**unchanged** on edit).
- `updated_at` on `survey_responses` and `survey_response_answers` behaves **as usual** (updates when rows are written).
- Edit history for the changelog is derived from **`logs.changes`** (see sync note below).

---

## Edit gating & submit semantics

- User **cannot submit** unless the form is **dirty** (at least one answer value **differs** from persisted values).
- Only **explicit submit** persists changes (no implicit save on navigation).
- **Unlimited** edits are allowed.
- An answer counts as **changed** only if its value **differs** from what was stored before submit.

---

## Concurrency

- **Last write wins**. No merge/conflict UI in this epic’s scope.

---

## Survey definition drift & validation

- If a survey **question is removed**, answers for it may be **orphaned** and are **never surfaced** in the GUI again.
- If **options or lists change**, use **best effort** for display; on submit, the response must be **valid under the current survey definition** at that time.

---

## Changelog — scope, API, source of truth

- **Granularity:** **Survey response** level — **one** changelog stream per **`surveyResponseId`**, not a separate changelog per answer.
- **Ordering (user-visible):** **Newest first** (reverse chronological) for that response’s combined history.
- **API:** All changelog UIs in this epic load data with:

  **`GET /surveyResponse/:surveyResponseId/changes`**

- **Source of truth:** **`logs.changes`** on the facility server. It is **not** a synced table; **edit history is tied to the facility where the edit occurred**. Other sites see **latest answers** via normal response sync only.
- **Overflow “Change log”** and inline **“view change log”** must show the **same** response-level content from the **same** endpoint.
- If there is **no** history for that response, UIs show **`<ContentUnavailableView>`** (or project equivalent), not an error.

---

## Reporting & integrations

- **Latest answer values only** outside the changelog UI (no requirement to expose historical values elsewhere).

---

## Mobile

- **No** code changes in the **Tamanu Mobile** package for this initiative. Do not rely on mobile for edited badges or changelog.

---

## Admin & configuration (changelog always on)

- Changelog for program form (and related) behaviour in this epic is **always on**; required for all Tamanu deployments.
- **`logs.record_change()`** always inserts into **`logs.changes`** for all tables that use that trigger, except when **`audit.pause`** is set on the DB session (tests and migrations). The global setting **`audit.changes.enabled`** / **`logs.is_audit_changes_enabled()`** no longer gates those inserts. Program-registry UI no longer uses **`useSetting('audit.changes.enabled')`** to hide condition history.
- Remove the **change log / audit-changes** toggle from the **admin panel** as part of this work (implementation may land in TAM-3996; rule is shared here).

---

## Figma (parent / overview)

- [Program form enhancements — node 12015-151844](https://www.figma.com/design/sy6gyLBPoSXuJNq5lEEOL8/Tamanu-Desktop-1?node-id=12015-151844)
