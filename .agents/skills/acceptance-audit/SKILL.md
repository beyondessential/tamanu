---
name: acceptance-audit
description: "Check whether this card's code meets the acceptance criteria"
label: "Acceptance audit"
category: verify
workhorse-version: 0.8.0
---

## Your task: Acceptance audit

Check whether the code on this card's branch meets the acceptance criteria. This is a compliance check against the specs, not a general code-quality review.

1. Find the card's base and diff against it as `.agents/docs/bases-and-dependencies.md` says.
2. Identify what this card was supposed to do: the spec changes in that diff, scoped to `specs/`, are the card's own additions and edits. Also read the surrounding specs in the same areas: they describe existing behaviour that must still be met and not regressed
3. Read the rest of the diff for the implementation
4. Walk the criteria one by one, both the card's new and changed criteria and the surrounding ones that should still hold. Does the code deliver each one? Has any existing behaviour regressed?
5. Flag criteria that are not yet implemented, partially implemented, or implemented incorrectly, and flag regressions separately
6. Flag any behaviour in the code that no criterion covers: it is either missing from the spec, or should not be in the code

Tie each finding to a specific criterion, with file and line references.

### Recording findings

Record the findings as `.agents/docs/card-issues.md` "Recording an audit's findings" says, with the summary grouped by spec.
