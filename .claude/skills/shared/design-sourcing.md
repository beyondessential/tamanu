# Design sourcing & preserving unchanged aspects

Rules for any UI artefact you produce — mockups (`/mock-this-up`, `/workshop`) and UI implementation (`/implement`, `/design-audit`). (In some setups this lives in a system prompt; here it lives in this doc, so read it before producing UI.)

## Source the visual language (in priority order)

1. **Read the actual implementation of the section** being worked on in the repo — the shipped components, views, and styles are the baseline for how the screen really looks today. Start here, not from imagination.
2. **Read implementations of similar components** elsewhere in the repo for patterns not yet present in the section.
3. **Cross-check the design system** — `packages/web/app/constants/styles.js` (colour palette + styling constants) and `packages/web/app/theme/theme.js` (Material-UI theme). Where the design system disagrees with older shipped code, the design system wins — it's the agreed direction.
4. **Don't reference mockups from other features** as inspiration unless explicitly asked — they're point-in-time artefacts, not canonical components.

## Preserving unchanged aspects (critical)

A UI change usually touches only part of an existing screen; the rest carries through from what's shipped.

- Author **fresh HTML/CSS only for the feature or tweak being developed**.
- For every other region, be **visually faithful to the current implementation** — same layout, components, copy, spacing, styling. Don't re-imagine, re-style, or re-layout regions the change isn't about, even if you think you can improve them.
- Visual fidelity is the standard, not literal markup copy — match the composed result of the repo's components.
- Don't let stale styling from other mockups leak into unchanged regions.

## Mockup file format

- A standalone HTML file with inline CSS, rendered inline (not as an image).
- An HTML comment header linking the spec it illustrates, e.g. `<!-- spec: invoicing/encounter-fees.md -->`.
- Store at `docs/specs/<area>/mockups/<slug>.html`.
