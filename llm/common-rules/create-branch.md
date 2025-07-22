# Context

Use this rule when you need to create a new branch for a card, based on the card code and understanding of the work being done from the conversation context and any local changes.

The project uses conventional commits and has specific branch naming and PR title requirements as outlined in CONTRIBUTING.md.

# Process

- Check if the card code has been provided in the conversation - if not, ask the user for it
- Identify the card code (e.g., NASS-1712, TUP-456) from the conversation or user response
- Analyse the conversation context and any git diff to understand what type of work is being done
- Determine the appropriate conventional commit type based on the work:
  - `feat` for new features
  - `fix` for bug fixes
  - `doc` or `docs` for documentation changes
  - `refactor` for code refactoring
  - `config` for configuration changes
  - `db` for database schema changes
  - `deps` for dependency changes
  - `style` for formatting changes
  - `test` for adding or fixing tests
  - `chore` for maintenance tasks
- Create a branch name using the format: `type/{card-code}/{brief-description}`
- Use kebab-case for the description part
- Keep the description concise but descriptive of the main change
- Run the git command to create and switch to the new branch

Example: `git switch -c feat/NASS-1712/restructure-llm-docs`

# Avoid

- Making the description too long or too generic
- Forgetting to include the card code in the branch name
- Proceeding without confirming the card code first
- Using commit type codes not commonly used in conventional commits

# Notes

- Use Australian/NZ English spelling and terminology in branch names and all outputs
