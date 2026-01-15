# Pull Requests - Tamanu

See also: @llm/project-rules/git-workflow.md for complete git conventions including branch naming and commit format.

## Conventional Commit Types

PR titles must use one of the allowed conventional commit types. The allowed types are:

**Allowed**: `chore`, `ci`, `config`, `db`, `feat`, `fix`, `fmt`, `merge`, `refactor`, `release`, `repo`, `revert`, `style`, `test`, `tweak`, `perf`

**NOT allowed**: `docs`, `doc`, `deps` (use `chore` instead for documentation and dependency changes)

Examples:
```bash
# Correct
gh pr create --title "chore: update CLAUDE.md with new guidelines" --fill
gh pr create --title "feat(invoicing): add sliding fee scale" --fill

# Wrong - "docs" is not in the allow-list
gh pr create --title "docs: update README" --fill
```

## Always Use the PR Template

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
