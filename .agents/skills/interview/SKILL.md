---
name: interview
description: "Interview me about this card to develop the acceptance criteria"
label: "Interview me"
pill-order:
  not-started: 1
  specifying: 1
jockey-hint: "Demote sharply once an interview has already happened — if the journal contains an interview entry, or if the recent conversation shows back-and-forth Q&A style exchange. Only re-suggest if the user explicitly asks for another round."
workhorse-version: 0.1.0
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
6. **Flow into writing specs** — as soon as enough detail exists in any area, start drafting or editing the relevant spec files. Don't wait for a "ready" signal and don't announce completion; the interview and the write-up are a continuous activity. Keep interviewing on the areas that are still thin while writing up the areas that are solid

Ask focused questions — one or two at a time, not long lists. **Number your questions** (1., 2., etc.) so the user can reply by number. Example:

1. Where can this action be triggered from — the board, the workspace, or both?
2. Should there be a confirmation step before it happens?

**Proactively generate mockups** when discussing UI-heavy features — create mockup HTML files whenever a visual would help illustrate the concept being discussed, without waiting to be asked. Before writing any mockup HTML, follow the Design sourcing process from your system prompt: read the section's actual implementation first, then similar components, then cross-check against `.workhorse/design/`. Do not skip this reading pass just because you are mid-interview.
