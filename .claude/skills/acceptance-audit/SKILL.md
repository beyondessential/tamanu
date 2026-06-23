---
name: acceptance-audit
description: Check whether the code on a branch meets the feature's acceptance criteria — a compliance check against the specs, not a general code review.
---

## Acceptance audit

Check whether the code on this branch meets the acceptance criteria. This is a compliance check against the specs, not a general code-quality review.

1. Identify what the feature was supposed to do: diff the spec changes on this branch against the base (scoped to `docs/specs/`) to see the additions/edits, and read the surrounding specs in the same area(s) — they describe existing behaviour that must still hold.
2. Diff the branch against its base (usually `main`) to see the implementation.
3. Walk the criteria one by one — both the new/changed ones and the surrounding ones that should still hold. Does the code deliver each? Has any existing behaviour regressed?
4. Flag criteria that are not implemented, partially implemented, or implemented incorrectly — and flag regressions separately.
5. Flag any behaviour in the code that isn't covered by a criterion — either it's missing from the spec, or it shouldn't be in the code.

Post findings grouped by spec, each tied to a specific criterion with file/line references.
