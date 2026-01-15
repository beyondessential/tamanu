# Tamanu - Development Guidelines for AI Assistants

This file contains rules and patterns that AI assistants should follow when working on this codebase.

## Pull Requests

### Always Use the PR Template

When creating pull requests with `gh pr create`, always use the repository's PR template. Do NOT provide a custom `--body` flag. Instead, let the template populate and fill in the sections:

```bash
# Correct - uses template
gh pr create --title "feat(scope): description" --fill

# Wrong - overwrites template
gh pr create --title "..." --body "custom body"
```

The PR template (`.github/pull_request_template.md`) contains important elements:

- **Deploy checkbox**: `<!-- #deploy -->` triggers deployment to Tamanu Internal
- **E2E checkbox**: `<!-- #e2e -->` triggers end-to-end tests
- **Reminder checklist**: Important steps like updating docs, adding tests, etc.

After creating the PR, edit it on GitHub to fill in the "Changes" section with a description.

## Release Branches

To check releases, look at the `release/2.xx` branches (e.g., `release/2.41`, `release/2.47`).
The most recent release will be the highest version branch of that form.

Example:

```bash
git branch -r | grep 'release/2\.' | sort -V | tail -5
```

## Creating Configuration and Usage Guides

When creating configuration and usage guides for new features (e.g., invoicing module), follow these principles:

### 1. Work from the Correct Branch

**Critical**: Always verify you're on the correct feature branch before writing documentation.

- Check `git status` and `git branch` to confirm the branch
- If the user mentions a specific branch (e.g., `epic-invoicing`), switch to it first
- Ask the user if unsure

### 2. Verify Everything by Reading Code

**Never guess or assume** - always verify by reading the actual implementation:

- Field names and their purposes
- UI workflows and button labels
- Conditional displays (e.g., cheque number column only showing when payment method is cheque)
- Automatic vs manual behaviors
- Validation rules and constraints
- Status transitions and what actions are allowed in each state

### 3. Audience: Project Managers, Not Developers

Configuration guides are for **Project Managers** who will configure the system and train staff.

**Avoid**:

- Database table names and schema details
- Implementation details
- Developer jargon or technical architecture explanations
- Code snippets (except JSON configuration examples)

**Include**:

- Clear step-by-step instructions
- What each configuration field means and when to use it
- Examples with realistic data
- What staff will see in the UI
- Common use cases and scenarios

### 4. No Repetition

If you've explained something once, don't repeat it elsewhere in the document.

### 5. Don't Tell PMs How to Do Their Job

Avoid sections like:

- "Best Practices for Project Managers"
- "How to Train Your Staff" (beyond describing what staff need to know)
- "Troubleshooting Tips"
- "Where to Get Help"
- Summary checklists or appendices

Config guides should explain **what the feature does and how to configure it**, not project management methodology.

### 6. Use Australian English

- "Finalise" not "Finalize"
- "Customisable" not "Customizable"
- "Cancelled" not "Canceled"

### 7. Structure and Format

**Typical structure**:

1. **Enable the Feature** - Feature flags and settings
2. **Configure Reference Data** - What data needs to be set up
3. **Staff Guide: Workflows** - How staff use the feature day-to-day

**Within each section**:

- Use concrete examples, not vague descriptions
- Show the actual import/export spreadsheet format, especially when there is a custom reference data importer (e.g., matrix format for price lists)
- Include real field names as they appear in the UI
- Explain conditional behaviors clearly (e.g., "this column only appears when...")

### 8. Import/Export Workflows

Tamanu uses **spreadsheet import/export** for reference data, not a UI form.

**Correct**: "Download the reference data export spreadsheet from your Tamanu system, open the Invoice Products tab, add rows with these columns..."

**Wrong**: "Navigate to Invoice Products in the reference data section and click Add Product"

### 9. Document Actual UI Behavior

Read the actual UI components to understand:

- What buttons/actions are available
- What modals appear and what fields they contain
- What happens when you click each action
- What validation occurs
- What columns appear in tables (and when they're conditional)

**Example**: Don't write "Click Refund to issue a refund" if there's no refund button in the actual code.

### 10. Distinguish Between Similar Actions

When there are multiple ways to do something, clearly explain the differences and when to use each.

**Example**: Cancel vs Delete invoices

- Cancel = voids but keeps for audit, blocks new invoice creation
- Delete = removes entirely, allows starting fresh
- Cancelled invoices CAN be deleted to recover from mistakes

## Additional Resources

For package-specific guidelines, use imports:

- See @README for project overview
- See @package.json for available npm commands for this project
- See @packages/database/CLAUDE.md for database and migration patterns
