---
name: spec-review
description: "Review this card's specs with fresh eyes for gaps, contradictions, and cross-spec impact"
label: "Review spec"
category: spec
workhorse-version: 0.8.3
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

Be specific and constructive. Reference exact criteria when noting issues.

### Recording findings

Before filing, read the card's rejections with `read_rejections`, and drop a finding that raises the same concern in the same spec as one the card has already rejected, so a second pass does not raise again what an earlier one settled.

Record the findings as `.agents/docs/card-issues.md` "Recording an audit's findings" says. With five or more open issues on the card, place them with `set_triage` before recording any disposition.

### Sorting out what needs a decision

Sort the findings into two kinds:

- **Needs a decision**: resolving it changes what the product does, and neither the specs nor the card settles which way. A choice between behaviours, a call on scope, or a contradiction where either side could be the one intended.
- **Evident fix**: any careful reader would resolve it the same way. A breach of the spec conventions, misplaced content, a missing cross-reference, wording whose intended meaning is clear from the rest, or an update to another spec that follows from the card's change.

In your reply, lead with the findings that need a decision, giving for each what the decision rests on, then summarise the rest grouped by spec. Record each finding that needs a decision as needing you with `set_issue_disposition`, then ask the user for the decisions as `.agents/docs/asking-questions.md` says.

### Fixing the findings

Once every decision is answered, or straight away when none is needed, fix every finding as `.agents/docs/card-issues.md` "Fixing" says, editing the specs as the findings and the answers direct. Running this review is asking for its fixes, so fix them whatever the card's Auto-fix toggle says.

- Where the user decides the spec stays as it is, the finding is skipped with their answer as its reason, and marked as a wrong finding when the answer shows it was mistaken.
- A finding that turns out to be separate work is recorded as needing a card rather than fixed.
- Outside a Workhorse turn, where the card's issue tools are not available, fix the findings all the same and say in your reply what you changed.

Finish with a reply naming each spec you changed and what changed in it.

If the decisions or the fixes take more than one turn, as a question asked in prose does, hold the pull request until the card's issues are handled, with `hold_pr` and `untilIssuesHandled` (see `.agents/docs/pull-requests.md`).
