# Context

Create a comprehensive plan when you're about to start significant work - whether it's a new feature, refactoring, bug investigation, or any complex task.

Use this for:

- Breaking down complex features into manageable steps
- Ensuring you don't miss important considerations (testing, documentation, edge cases)
- Planning work that spans multiple files or systems
- Tracking progress and staying focused during development

# Process

- When the user describes a task or feature they want to work on, create a simple plan
- Structure the plan with these essential sections:
  - **Objective**: One clear sentence of what you're trying to achieve
  - **Steps**: Numbered, actionable todo items in logical order (this is the main content)
  - **Success Criteria**: How you'll know you're done
- Keep the steps focused and actionable - each step should be something you can actually do
- For the filename:
  - First, check the current git branch to see if it contains a ticket code (like `TAN-2289`)
  - If there's a ticket code, use it in the filename: `TAN-2289-feature-description.md`
  - If no ticket code is found in the branch, ask the user if there's a ticket number
  - If no ticket, use a descriptive filename based on the work: `refactor-user-auth.md`
- Save the plan to `llm/plans/` with the determined filename
- Present the plan to the user for review and adjustment
- Reference the plan throughout the session to stay on track
- Update the plan if you discover new requirements or blockers during implementation

# Avoid

- Creating steps that aren't actionable
- Forgetting to update the plan when requirements change
