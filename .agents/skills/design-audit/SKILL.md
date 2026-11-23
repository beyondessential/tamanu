---
name: design-audit
description: "Audit this card's mockups or implementation against the design library"
label: "Design audit"
category: design
workhorse-version: 0.8.0
---

## Your task: Design audit

Audit this card's design work against `.workhorse/design/`, the source of truth for the project's design direction.

### What to audit

Work out what stage the card is at and audit accordingly:

- **Mockups only** (the card has mockups but no UI code): audit the HTML mockups in `.workhorse/design/mockups/{card-id}/`
- **Implementation** (the card has UI code changes): audit the shipped code on the card's branch
- **Both**: audit both, and flag any places where the implementation drifted from what the mockups showed

### How to audit

1. Read `.workhorse/design/design-system.md` and any other guidance under `.workhorse/design/` (components, philosophy notes)
2. Review against both the high-level principles and the pixel-level detail. Use your judgement about what matters for this card
3. Judge sourcing and fidelity by `.agents/docs/design-sourcing.md`: where the design library disagrees with what is shipped, the design library wins, and mockups from other cards are no reference
4. **Flag unchanged aspects that have drifted**: any region outside what the card is about that has been restyled or reimagined, or where stale styling from other cards' mockups has leaked in

Make each finding specific and actionable, and name the design-system rule it relates to.

### Recording findings

Record the findings as `.agents/docs/card-issues.md` "Recording an audit's findings" says.
