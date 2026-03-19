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
```
# Correct
feat(invoicing): SAV-1234: add sliding fee scale
fix(labs): COOL-567: correct status transition
chore: no-issue: update llm documentation
refactor(auth): no-issue: simplify token validation

# Wrong - missing ticket/no-issue
feat(invoicing): add sliding fee scale

# Wrong - missing second colon
feat(invoicing): SAV-1234 add sliding fee scale

# Wrong - docs not allowed
docs: no-issue: update README
```

## Always Use the PR Template

When creating pull requests with `gh pr create`, always include the repository's PR template in the body. **Do NOT use `--fill`** — it auto-fills from commit messages and skips the template entirely.

Read `.github/pull_request_template.md` **from the target branch** (templates may differ between branches), replace the Changes placeholder with an actual summary, and pass it as the PR body.

The summary should give reviewers context — what changed, why, and any notable details. Keep it concise (a short paragraph is fine).

**Important:** Do NOT use command substitution (`$(...)`) in `gh pr create` — it triggers permission prompts. Instead, use separate steps:

1. Read the template using the Read tool (path: `.github/pull_request_template.md`)
2. Replace the placeholder text with your summary
3. Write the final body to a temp file
4. Pass the temp file to `gh pr create --body-file`

```bash
# Step 1-3: Read template with Read tool, construct body, write to temp file (.tmp/ is gitignored)
# Step 4: Create PR using the temp file, then clean up
gh pr create --title "feat(scope): TICKET-123: description" --body-file .tmp/pr-body.md
rm .tmp/pr-body.md
```

**Don't:**
- Use `--fill` (skips the template, fills from commits)
- Pass a custom `--body` without the template
- Leave the placeholder text in the Changes section

The PR template contains important elements:

- **Changes section**: Brief description of the PR for reviewer context
- **Deploy checkbox**: `<!-- #deploy -->` triggers deployment to Tamanu Internal
- **E2E checkbox**: `<!-- #e2e -->` triggers end-to-end tests
- **Reminder checklist**: Important steps like updating docs, adding tests, etc.

## Always Fix Linting Issues Before Pushing

Before pushing commits or creating a PR, always run the linter on changed files and fix any errors:

```bash
# Lint specific changed files
npx eslint path/to/changed/file.mjs

# Or lint all changed files at once
npx eslint $(git diff --name-only --diff-filter=d HEAD | grep -E '\.(js|jsx|mjs|cjs|ts|tsx)$')
```

Do not push code with lint errors. Fix all issues before committing.
