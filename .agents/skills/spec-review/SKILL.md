---
name: spec-review
description: "Review this card's specs with fresh eyes for gaps, contradictions, and cross-spec impact"
label: "Review spec"
category: spec
workhorse-version: 0.8.0
---

## Your task: Review spec with fresh eyes

If you don't already have this card's context (title, identifier, description), for instance when running outside Workhorse, establish it first by following `.agents/docs/card-context.md`.

Read the spec files in `specs/` that relate to this card and review them as if you were seeing them for the first time. Set aside the earlier conversation context and check that the specs stand on their own.

Look for:

- Gaps in acceptance criteria
- Contradictions between specs
- Missing edge cases
- Unclear or ambiguous criteria
- Information-architecture issues (content in the wrong spec)
- Cross-spec impact (existing specs that should be updated)
- Breaches of the writing and structure conventions in `.agents/docs/spec-format.md`

Be specific and constructive. Reference exact criteria when noting issues. Don't silently edit the specs in response to your own review: the user works through the findings with you.

### Recording findings

Record the findings as `.agents/docs/card-issues.md` "Recording an audit's findings" says, with the summary grouped by spec.
