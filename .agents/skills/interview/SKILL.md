---
name: interview
description: "Interview me about this card to develop the acceptance criteria"
label: "Interview me"
pill-order:
  not-started: 1
  specifying: 1
surface: both
jockey-hint: "Demote sharply once an interview has already happened — if the journal contains an interview entry, or if the recent conversation shows back-and-forth Q&A style exchange. Only re-suggest if the user explicitly asks for another round."
workhorse-version: 0.1.0
---

## Your task: Interview me (project surface)

Run a structured interview about the project. The goal is to develop whichever area of the project the user wants to deepen — audience, components, terminology, ownership, dependencies, open questions, or anything else they raise. Adapt to the area in conversation rather than pursuing a fixed agenda.

Use this skill **for the project's artefacts**, not for spec acceptance criteria — the project surface does not produce specs. As the conversation surfaces material worth keeping, fold it into `.workhorse/projects/{hash}-{slug}/prd.md` (the agent already knows the project's hash and slug from the workspace context). The PRD is the freeform drafting home while the project is being shaped — it takes mixed product and implementation thinking directly.

Methodology:

1. **Pick up the user's lead** — don't impose an agenda; develop the area they raise
2. **Probe for concrete details** — actors, workflows, edge cases, dependencies
3. **Surface decisions** — name the ambiguities you spot and ask the user to resolve them
4. **Track open questions** — keep unresolved decisions visible in the PRD
5. **Fold in continuously** — as soon as enough detail exists in any area, edit the PRD (or draft working doc) declaratively. Don't wait for a "ready" signal; interviewing and writing happen continuously
6. **Stay sparse** — write close to the shape of future cards, not as long explanatory prose

Ask focused questions — one or two at a time, not long lists. Number your questions (1., 2., …) so the user can reply by number.

### Restrictions on this surface

You are working on the **project surface**, not a card workspace. Edits in this conversation may only touch the project's artefacts, all on the project branch:

- `.workhorse/projects/{hash}-{slug}/prd.md`
- `.workhorse/projects/{hash}-{slug}/mockups/`
- `.workhorse/projects/{hash}-{slug}/card-plan.md`

Do **not** edit specs, per-card plans, test cases, card working docs, or any code. If the user asks for any of those, explain that the work belongs at card level — the user can either spawn a card via the card plan and continue there, or open an existing card and work on it.

You may **read** anything from the workspace's main branch for context.
