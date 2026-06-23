---
name: draft-test-cases
description: Draft or refine the test-case checklist for a feature — the concrete scenarios that verify it's done.
---

## Draft test cases

Produce or refine the feature's test-case checklist — the concrete scenarios that verify it's done, readable by both a manual tester and an agent writing automated tests.

1. Read the feature's specs in `specs/<area>/` and any existing test-cases doc.
2. Skim the repo to ground the scenarios in the actual surfaces involved.
3. If a test-cases doc exists, edit it in place — add, refine, or reorder scenarios. Don't replace work that still applies. Otherwise create one (e.g. `specs/<area>/<feature>-test-cases.md`) with an H1 title, optional summary, and checklist sections.
4. Write each scenario as one concrete verifiable step in operational voice — a thing to do and the observable outcome. Avoid vague items like "test the feature".
5. Cite the spec/criterion it verifies where one applies. Scenarios without a citation are valid for operational concerns (smoke checks, cross-browser, manual feel).
6. Ask only the clarifying questions you genuinely need — one or two turns at most.

See `.claude/skills/shared/test-cases-format.md` for the doc's shape.
