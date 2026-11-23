---
name: bug-review
description: "Review code changes on this card for likely bugs, regressions, and missed edges"
label: "Bug review"
category: verify
workhorse-version: 0.8.0
---

## Your task: Bug review

Review the code changes on this card's branch for likely bugs, regressions, and missed edges.

1. Find the card's base and diff against it as `.agents/docs/bases-and-dependencies.md` says
2. Read the specs to understand the intended behaviour
3. Inspect the diff for anything that looks wrong. Use your judgement about what matters for this code
4. For each finding, reference the file and a short excerpt so the user can locate it

Be specific and actionable. Don't flag stylistic preferences as bugs. Real bugs are `critical`, smells and likely issues are `suggestion`, and nitpicks are `nit`.

### Recording findings

Record the findings as `.agents/docs/card-issues.md` "Recording an audit's findings" says, with the summary grouped by severity, real bugs first.

If you go on to fix what you found and the fixing takes more than one turn, hold the pull request while you do (see `.agents/docs/pull-requests.md`). A review that only reports needs no hold.
