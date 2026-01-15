# Pull Requests - Tamanu

See also: @llm/project-rules/git-workflow.md for complete git conventions including branch naming and commit format.

## PR Title Format

PR titles must follow this format:

```
type(scope): TICKET-123 description
```

Or if there's no ticket:

```
type(scope): no-issue description
```

**Required**: type, ticket number (or "no-issue"), description
**Optional**: scope

### Allowed Types

`chore`, `ci`, `config`, `db`, `feat`, `fix`, `fmt`, `merge`, `refactor`, `release`, `repo`, `revert`, `style`, `test`, `tweak`, `perf`

**NOT allowed in Tamanu**: `docs`, `doc`, `deps` (use `chore` instead)

**Examples**:
```bash
# Correct - with ticket
gh pr create --title "feat(invoicing): SAV-1234 add sliding fee scale" --fill
gh pr create --title "fix(labs): COOL-567 correct status transition" --fill

# Correct - without ticket
gh pr create --title "chore: no-issue update llm documentation" --fill
gh pr create --title "refactor(auth): no-issue simplify token validation" --fill

# Wrong - missing ticket/no-issue
gh pr create --title "feat(invoicing): add sliding fee scale" --fill

# Wrong - docs not allowed
gh pr create --title "docs: no-issue update README" --fill
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
