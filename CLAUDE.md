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

## Package-Specific Guidelines

See also:
- `packages/database/CLAUDE.md` - Database and migration patterns
