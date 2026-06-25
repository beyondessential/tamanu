---
name: mock-this-up
description: Produce a standalone HTML mockup for the UI being discussed, grounded in the existing implementation.
---

## Mock this up

Produce an HTML mockup for the UI being discussed. Skip extended exploration — go straight to the mockup.

1. Identify the target screen from the description and conversation context.
2. Source the visual language per `.agents/skills/shared/design-sourcing.md` — read the actual implementation of the section, then similar components.
3. **Preserve unchanged aspects** (see the same doc) — author fresh HTML/CSS only for the feature being developed; be visually faithful to the current implementation everywhere else.
4. Write a standalone HTML file with inline CSS at `specs/<area>/mockups/<slug>.html`, with an HTML comment header linking to the relevant spec if one exists.
5. Briefly summarise what you produced.
