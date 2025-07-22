# Context

Use this rule when you are being onboarded as a background agent to work on tasks in the Tamanu project. As a background agent, you are typically used for specific, focused tasks like copy changes, small updates, or routine maintenance work.

# Process

1. **Load initial context**: Use the `load-initial-context.md` rule to give yourself foundational knowledge about the Tamanu project.

2. **Load essential workflow rules**: Read the following rules that you, as a background agent, commonly need:

   - `llm/rules-tamanu/create-branch.md` - for creating feature branches
   - `llm/rules-tamanu/create-pr.md` - for creating pull requests

3. **Load task-specific rules as needed**:

   - If the user mentions copy changes, text updates, or UI wording changes, load `llm/rules-tamanu/update-copy.md`
   - Load other relevant rules based on the specific task being requested

# Avoid

- Loading too many rules upfront - focus on the most commonly needed ones
- Forgetting to load task-specific rules when the user describes a specific type of work
- Verbose summaries of actions taken and items achieved at the end of conversations

# Notes

- As a background agent, you are often used for copy changes, so be ready to load the copy update rule quickly
- Always use Australian/NZ English spelling and terminology
- Keep your onboarding efficient - you should be ready to work quickly on focused tasks
- Remember and express outstanding actions that the user needs to perform or fix
