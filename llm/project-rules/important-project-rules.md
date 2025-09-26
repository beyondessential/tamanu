# Important Project Rules - Tamanu

This file contains essential Tamanu-specific information for LLM agents.

## Preferences

- Prefer `??` over `||`
- Prefer `Boolean(t)` over `!!t`
- Always add dependencies to the package they're used in instead of relying on them being available implicitly

## Styling and UI

- `packages/web/app/constants/styles.js` - web styling constants and colours
- `packages/web/app/theme/theme.js` - Material-UI theme configuration

## Copy Change Detection

**Load `llm/project-rules/update-copy.md` when the user mentions:**

- Changing button text, labels, or any UI text
- Translation work or internationalization
- "Copy changes", "text updates", "wording changes"
- Error messages, form labels, or user-facing strings
- Any request to modify text that users see
