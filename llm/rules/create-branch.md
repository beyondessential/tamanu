# Context

Use this rule when you need to create a new branch for a ticket, based on the ticket code and understanding of the work being done from the conversation context and any local changes.

The project uses conventional commits and has specific branch naming and PR title requirements as outlined in CONTRIBUTING.md.

# Process

- Check if the ticket code has been provided in the conversation - if not, ask the user for it
- Identify the ticket code (e.g., NASS-1712) from the conversation or user response
- Analyze the conversation context and any git diff to understand what type of work is being done
- Determine the appropriate conventional commit type based on the work:
  - `feat` for new features
  - `fix` for bug fixes
  - `doc` for documentation changes
  - `refactor` for code refactoring
  - `config` for configuration changes
  - `db` for database schema changes
  - `deps` for dependency changes
  - Other types as listed in CONTRIBUTING.md
- Create a branch name using the format: `feat/{ticket-code}-{brief-description}`
- Use kebab-case for the description part
- Keep the description concise but descriptive of the main change
- Run the git command to create and switch to the new branch

Example: `git checkout -b feat/NASS-1712-restructure-llm-docs`

# Avoid

- Making the description too long or too generic
- Forgetting to include the ticket code in the branch name
- Proceeding without confirming the ticket code first
- Using commit type codes not listed above (e.g. `feature/` rather than `feat/`)
