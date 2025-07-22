# Context

Use this rule when you need to create a commit for staged changes, following the project's conventional commit format as outlined in CONTRIBUTING.md.

The project requires conventional commit format for PR titles, and it's good practice to use it for individual commits as well.

# Process

- First, stage all files using `git add .` to ensure all changes are included
- Check what files are staged using `git status --porcelain` (avoid `git status` alone as it can be verbose)
- If you need to see changes, use `git diff --cached --name-only` for file list or `git diff --cached --stat` for summary
- If you need to see actual diff content, use `git diff --cached | cat` to avoid paging issues
- Analyse the staged changes to understand what type of work was done
- Determine the appropriate conventional commit type:
  - `feat` for new features
  - `fix` for bug fixes
  - `doc` or `docs` for documentation changes
  - `refactor` for code refactoring
  - `config` for configuration changes
  - `db` for database schema changes
  - `deps` for dependency changes
  - `repo` for repository structure changes
  - `style` for formatting changes
  - `test` for adding or fixing tests
  - `chore` for maintenance tasks
- Determine if a scope is appropriate (optional but helpful for clarity)
- Write a commit message in the format: `type(scope): description` or `type: description`
- Keep the description concise but descriptive of what was changed
- Use present tense and imperative mood (e.g., "add", "fix", "update")
- Run `git commit -m "commit message"`
- If the user requested "commit and push", also run `git push` after the commit

Example: `git commit -m "doc: restructure LLM documentation system"`

# Avoid

- Using past tense in commit messages (e.g., "added" instead of "add")
- Making commit messages too vague or too detailed
- Including a verbose bullet-point list of changes as the body of the commit
- Forgetting to stage all files before committing
- Using commands that produce paged output like `git diff`, `git log`, or `git show` without `| cat`

# Notes

- Use Australian/NZ English spelling (e.g., "organise", "colour", "centre") instead of American English (e.g., "organize", "color", "center")
- Always stage all changes before committing to ensure consistency
- When user says "commit and push", perform both operations in sequence
- Commit incrementally instead of making large changesets whenever possible
