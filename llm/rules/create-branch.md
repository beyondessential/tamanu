# Context

Use this rule when you need to create a new branch for a task, based on the task/card code and understanding of the work being done from the conversation context and any local changes.

# Process

- Check if the task/card code has been provided in the conversation - if not, ask the user for it
- Identify the task/card code (e.g., PROJ-1712, TASK-123) from the conversation or user response
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
- Create a branch name using the format: `type/{task-code}/{brief-description}`
- Use kebab-case for the description part
- Keep the description concise but descriptive of the main change
- Run the git command to create and switch to the new branch

Example: `git switch -c feat/PROJ-1712/restructure-llm-docs`

# Avoid

- Making the description too long or too generic
- Forgetting to include the task/card code in the branch name
- Proceeding without confirming the task/card code first
- Using commit type codes not commonly used in conventional commits

# Notes

- Adapt the task/card format to match the project's tracking system
- Use consistent naming conventions across the project
