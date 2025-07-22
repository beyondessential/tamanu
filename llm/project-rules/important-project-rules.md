# Important Project Rules - Tamanu

This file contains essential Tamanu-specific information for LLM agents.

## Key File Locations

### Styling and UI

- `packages/web/app/constants/styles.js` - web styling constants and colours
- `packages/web/app/theme/theme.js` - Material-UI theme configuration

## Translation System

- The project uses a TranslatedText system for internationalization
- **For any copy/text changes, UI wording, or translation work**: Load `llm/project-rules/update-copy.md`
- Focus on TranslatedText system integration for all user-facing text

## Development Conventions

- Uses Linear for project management with NASS- card codes
- Follows conventional commit format as outlined in CONTRIBUTING.md
- PR templates include specific sections for deployment and testing

## Copy Change Detection

**Load `llm/project-rules/update-copy.md` when the user mentions:**

- Changing button text, labels, or any UI text
- Translation work or internationalization
- "Copy changes", "text updates", "wording changes"
- Error messages, form labels, or user-facing strings
- Any request to modify text that users see
