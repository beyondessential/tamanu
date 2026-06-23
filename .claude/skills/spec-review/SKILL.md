---
name: spec-review
description: Review a feature's specs with fresh eyes for gaps, contradictions, missing edge cases, and cross-spec impact.
---

## Review spec with fresh eyes

Read the spec files in `docs/specs/<area>/` that relate to this feature and review them as if seeing them for the first time. Set aside earlier conversation context — check the specs stand on their own.

Look for:

- Gaps in acceptance criteria
- Contradictions between specs
- Missing edge cases
- Unclear or ambiguous criteria
- Content in the wrong spec (information-architecture issues)
- Cross-spec impact (existing specs that should be updated)
- Violations of the conventions in `.claude/skills/shared/spec-format.md`

Be specific and constructive — reference exact criteria when noting issues. Post findings as a structured message the user can work through with you; don't silently edit the specs in response to your own review.
