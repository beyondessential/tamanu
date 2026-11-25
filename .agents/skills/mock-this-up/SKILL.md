---
name: mock-this-up
description: "Produce an HTML mockup for the UI being discussed"
label: "Mock this up"
category: design
workhorse-version: 0.8.0
---

## Your task: Mock this up

If you don't already have this card's context (title, identifier, description) — for instance when running outside Workhorse — establish it first by following `.agents/docs/card-context.md`.

Produce an HTML mockup for the UI being discussed. Skip extended exploration — go straight to the mockup.

1. Identify the target screen from the card description and conversation context
2. Source the visual language as `.agents/docs/design-sourcing.md` says, before writing any HTML: from a snapshot where one covers the screen, otherwise from the implementation, similar components and the design library. Do not skip steps
3. Make only the change being discussed, and keep every other region of the screen faithful to the baseline, as that doc's "Preserving unchanged aspects" says
4. Write to `.workhorse/design/mockups/{card-id}/{slug}.html` with inline CSS and an HTML comment header linking to the relevant spec (if one exists). That folder is card scratch, stripped when the card merges. A mockup anyone outside the card will need goes to `.workhorse/design/designs/` instead, where it persists (see `.agents/docs/card-artefacts.md`)
5. Briefly summarise what you produced
