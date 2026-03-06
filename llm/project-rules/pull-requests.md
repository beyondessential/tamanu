# Pull Requests - Tamanu

See also: @llm/project-rules/git-workflow.md for complete git conventions including branch naming and commit format.

## PR Title Format

PR titles must follow this format:

```
type(scope): TICKET-123: description
```

Or if there's no ticket:

```
type(scope): no-issue: description
```

**Required**: type, ticket number (or "no-issue"), description
**Optional**: scope
**Note**: Two colons total - one after type(scope), one after ticket/no-issue

### Allowed Types

`chore`, `ci`, `config`, `db`, `feat`, `fix`, `fmt`, `merge`, `refactor`, `release`, `repo`, `revert`, `style`, `test`, `tweak`, `perf`

**NOT allowed in Tamanu**: `docs`, `doc`, `deps` (use `chore` instead)

**Examples**:
```bash
# Correct - with ticket
gh pr create --title "feat(invoicing): SAV-1234: add sliding fee scale" --body "$(cat .github/pull_request_template.md)"
gh pr create --title "fix(labs): COOL-567: correct status transition" --body "$(cat .github/pull_request_template.md)"

# Correct - without ticket
gh pr create --title "chore: no-issue: update llm documentation" --body "$(cat .github/pull_request_template.md)"
gh pr create --title "refactor(auth): no-issue: simplify token validation" --body "$(cat .github/pull_request_template.md)"

# Wrong - missing ticket/no-issue
gh pr create --title "feat(invoicing): add sliding fee scale" --body "$(cat .github/pull_request_template.md)"

# Wrong - missing second colon
gh pr create --title "feat(invoicing): SAV-1234 add sliding fee scale" --body "$(cat .github/pull_request_template.md)"

# Wrong - docs not allowed
gh pr create --title "docs: no-issue: update README" --body "$(cat .github/pull_request_template.md)"
```

## Always Use the PR Template

When creating pull requests with `gh pr create`, always include the repository's PR template in the body. **Do NOT use `--fill`** — it auto-fills from commit messages and skips the template entirely.

Read `.github/pull_request_template.md` **from the target branch** (templates may differ between branches) and pass its contents as the PR body:

```bash
# Correct - includes the PR template from the target branch
gh pr create --title "feat(scope): TICKET-123: description" --body "$(git show origin/<base-branch>:.github/pull_request_template.md)"

# Also correct - if already on the target branch, can use local file
gh pr create --title "feat(scope): TICKET-123: description" --body "$(cat .github/pull_request_template.md)"

# Wrong - skips the template, fills from commits
gh pr create --title "..." --fill

# Wrong - overwrites template with custom body
gh pr create --title "..." --body "custom body"
```

The PR template (`.github/pull_request_template.md`) contains important elements:

- **Deploy checkbox**: `<!-- #deploy -->` triggers deployment to Tamanu Internal
- **E2E checkbox**: `<!-- #e2e -->` triggers end-to-end tests
- **Reminder checklist**: Important steps like updating docs, adding tests, etc.

After creating the PR, edit it on GitHub to fill in the "Changes" section with a description.

## Always Fix Linting Issues Before Pushing

Before pushing commits or creating a PR, always run the linter on changed files and fix any errors:

```bash
# Lint specific changed files
npx eslint path/to/changed/file.mjs

# Or lint all changed files at once
npx eslint $(git diff --name-only --diff-filter=d HEAD | grep -E '\.(js|jsx|mjs|cjs|ts|tsx)$')
```

Do not push code with lint errors. Fix all issues before committing.
