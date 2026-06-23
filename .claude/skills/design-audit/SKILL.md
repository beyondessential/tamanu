---
name: design-audit
description: Audit a feature's mockups or UI implementation against the design system, flagging drift and re-styled unchanged regions.
---

## Design audit

Audit the feature's design work against the design system (`packages/web/app/constants/styles.js`, `packages/web/app/theme/theme.js`) and the rules in `.claude/skills/shared/design-sourcing.md`.

### What to audit

- **Mockups** — the HTML mockups under `docs/specs/<area>/mockups/`, or
- **Implementation** — the UI code changes on the branch, or
- **Both** — and flag where the implementation drifted from what the mockups showed.

### How

1. Review against both the high-level design principles and the pixel-level detail — use judgement about what matters here.
2. Where the design system disagrees with older shipped code, the design system wins.
3. **Flag unchanged aspects that have drifted** — a change should only re-style the feature it's about. Call out any surrounding region that's been re-styled or re-imagined, or where stale styling has leaked in (see "Preserving unchanged aspects" in `.claude/skills/shared/design-sourcing.md`).

Post findings as specific, actionable items, each tied to the design rule it relates to.
