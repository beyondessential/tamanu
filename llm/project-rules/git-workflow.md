# Git Workflow - Tamanu

This file contains Tamanu-specific git conventions. For general git rules, also see:
- @llm/common-rules/commit.md - General commit guidelines
- @llm/common-rules/create-branch.md - General branch creation
- @llm/common-rules/rebase-branch.md - Rebasing guidelines

## Conventional Commit Types (Tamanu-Specific)

Tamanu enforces specific conventional commit types in PR titles via CI checks.

**Allowed types**: `chore`, `ci`, `config`, `db`, `feat`, `fix`, `fmt`, `merge`, `refactor`, `release`, `repo`, `revert`, `style`, `test`, `tweak`, `perf`

**NOT allowed**: `docs`, `doc`, `deps` (use `chore` instead)

**Examples**:
```bash
# Correct
git commit -m "chore: update documentation"
git commit -m "feat(invoicing): add sliding fee scale"
git commit -m "fix(labs): correct status transition"
git commit -m "db: add invoice_products.insurable column"

# Wrong - will fail CI on PR
git commit -m "docs: update README"  # Use 'chore' instead
git commit -m "deps: upgrade react"  # Use 'chore' instead
```

## Branch Naming

Branch names should follow the pattern: `type/{card-code}/{brief-description}` or `type/{brief-description}` if no card.

**Examples**:
```bash
# With card code
git checkout -b feat/SAV-1234/add-invoice-payments
git checkout -b fix/COOL-567/lab-status-bug

# Without card code
git checkout -b chore/update-llm-rules
git checkout -b refactor/simplify-invoice-calculations
```

## Commit Message Format

### Standard Commits

Use conventional commit format:
```
type(scope): description

Optional body with more details.
```

### Co-Authored Commits

When working with AI assistants (Claude, etc.), add Co-Authored-By trailer:

```bash
git commit -m "$(cat <<'EOF'
feat(invoicing): add sliding fee scale feature

Implements income-based discount calculation using 12x6 matrix
for household size and income brackets.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Important**: Always use heredoc format (`cat <<'EOF'`) for multi-line commits to ensure proper formatting.

## Pull Request Workflow

1. **Create branch** from appropriate base (usually `main` or epic branch)
2. **Make changes** and commit incrementally
3. **Push branch** to origin
4. **Create PR** using template (see @llm/project-rules/pull-requests.md)
5. **Ensure PR title** uses allowed conventional type
6. **Fill in PR template** - don't use custom `--body`

```bash
# Complete workflow
git checkout -b feat/SAV-1234/new-feature
# ... make changes ...
git add .
git commit -m "feat(scope): add new feature"
git push -u origin feat/SAV-1234/new-feature
gh pr create --title "feat(scope): add new feature" --fill
```

## Working with Feature Branches

When working on features developed in epic branches (e.g., `epic-invoicing`):

1. **Always verify you're on the correct branch** before documenting or coding
2. **Switch to the feature branch** if the user mentions it
3. **Check for field/behavior differences** - if code doesn't match user examples, you're on the wrong branch

```bash
# Check current branch
git status
git branch

# Switch to feature branch
git checkout epic-invoicing

# Verify it's the right code
# Read files to confirm field names, behaviors match user's description
```

## Common Patterns

### Amending Commits (Be Careful!)

Only amend commits that:
- Haven't been pushed yet, OR
- You're about to force-push with `--force-with-lease`

```bash
# Safe - not pushed yet
git add file.md
git commit --amend --no-edit

# Safe - force push with lease
git add file.md
git commit --amend --no-edit
git push --force-with-lease
```

**Never amend** commits that:
- Have been pushed and others may have pulled
- Are not created by you in this session

### Checking What Changed

```bash
# See staged files
git status --porcelain

# See file names that changed
git diff --cached --name-only

# See summary of changes
git diff --cached --stat

# See actual diff (avoid paging)
git diff --cached | cat
```

## Australian English

Always use Australian/NZ English spelling in:
- Commit messages: "Finalise" not "Finalize"
- Branch names: "customise" not "customize"
- Code comments: "colour" not "color"
