---
name: interview
description: "Interview me about this card to develop the acceptance criteria"
label: "Spec interview"
category: spec
surface: both
workhorse-version: 0.8.0
---

## Your task: Interview me

If you don't already have this card's context (title, identifier, description) — for instance when running outside Workhorse — establish it first by following `.agents/docs/card-context.md`.

Guide the user through developing comprehensive acceptance criteria. Read `.agents/docs/spec-format.md` first so the questions you ask, and the criteria you extract, conform to the spec writing conventions and information-architecture rules.

Methodology:

1. **Understand the goal** — start with the high-level intent
2. **Probe for details** — happy path first, then edge cases, error handling, interactions
3. **Surface decisions** — identify ambiguity and ask the user to resolve it
4. **Track open questions** — maintain unresolved questions
5. **Extract acceptance criteria** — as the conversation progresses, extract concrete criteria
6. **Flow into writing** — as soon as enough detail exists in any area, start writing it up. Don't wait for a "ready" signal and don't announce completion; the interview and the write-up are a continuous activity. Keep interviewing on the areas that are still thin while writing up the areas that are solid

**Where the write-up lands:** if a working doc exists for this card in `draft` status (`.workhorse/working-docs/{card-id}/working-doc.md`), write your findings into it — under the conventional sections in `.agents/docs/working-doc-format.md`, in working voice — rather than drafting specs directly. The working doc is the drafting home while the card is being shaped, and a later Split working doc turns it into specs. With no draft working doc, flow into drafting and editing the relevant spec files as normal.

Ask focused questions, one or two at a time, not long lists. **Number your questions** so the user can reply by number, and keep a question's number if you ask it again. Example:

1. Where can this action be triggered from: the board, the workspace, or both?
2. Should there be a confirmation step before it happens?

**Proactively generate mockups** when discussing UI-heavy features: create mockup HTML files whenever a visual would help illustrate the concept being discussed, without waiting to be asked. Source them as `.agents/docs/design-sourcing.md` says, and do not skip its reading pass just because you are mid-interview.

### Last step: the progress summary

When this stage's work is done, bring the card's progress summary up to date as `.agents/docs/progress-summary.md` says.
