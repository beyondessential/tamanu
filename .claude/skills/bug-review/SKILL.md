---
name: bug-review
description: Review the code changes on a branch for likely bugs, regressions, and missed edge cases.
---

## Bug review

Review the code changes on this branch for likely bugs, regressions, and missed edges.

1. Diff the branch against its base (usually `main`) to see what's changed.
2. Read the relevant specs in `docs/specs/<area>/` to understand the intended behaviour.
3. Inspect the diff for anything that looks wrong — use judgement about what matters for this code.
4. Post findings grouped by severity: real bugs first, then smells / likely issues, then nitpicks.
5. For each finding, reference the file and a short excerpt so it's easy to locate.

Be specific and actionable. Don't flag stylistic preferences as bugs.
