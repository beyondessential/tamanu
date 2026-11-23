---
name: review-prd
description: "Fresh-eyes review of the project's PRD for gaps, contradictions, vague phrasing, and unresolved decisions"
label: "Review PRD"
category: plan
surface: project
workhorse-version: 0.8.0
---

## Your task: Review PRD with fresh eyes

Read the project's PRD at `.workhorse/projects/{hash}-{slug}/prd.md` as if you were seeing it for the first time. Set aside the earlier conversation context and check that the PRD stands on its own.

Look for:

- **Missing sections** — areas the project clearly cares about but the PRD doesn't cover
- **Contradictions** — statements that disagree with each other or with the project description
- **Vague phrasing** — sentences that sound like a PRD but don't say anything concrete. Stacking adjectives, corporate-template language, "seamless / robust / scalable"
- **Unresolved decisions** — open questions that should be named but aren't, or named questions that have actually been decided and should be folded into prose
- **Unticketable bullets** — items written so abstractly that nobody could turn them into a card without re-interviewing

Be specific. Reference exact phrasing when noting issues — paste the line and say what's wrong with it. Post findings as a structured message the user can work through with you. Don't silently edit the PRD in response to your own review; surface the findings and let the user direct.

### Restrictions on this surface

You are working on the project surface, not a card. Keep to what `.agents/docs/project-surface.md` allows.
