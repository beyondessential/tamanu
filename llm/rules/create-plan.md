# Context

Use this rule when you need to create a development plan for a complex feature or significant piece of work.

This helps break down large tasks into manageable steps and ensures nothing important is missed.

# Process

- Review the conversation history and requirements to understand the full scope of work
- Create a new .md file in `llm/plans/` with a descriptive name (e.g., `user-authentication-overhaul.md`, `payment-integration-plan.md`)
- Structure the document with these sections:
  - **Overview**: What needs to be accomplished and why
  - **Requirements**: Key functional and non-functional requirements
  - **Approach**: High-level strategy for implementation
  - **Implementation Steps**: Detailed breakdown of tasks in logical order
  - **Dependencies**: What needs to be done first or what this depends on
  - **Risks**: Potential issues and mitigation strategies
  - **Testing Strategy**: How this will be tested
  - **Rollout Plan**: How this will be deployed and released
- Break down implementation steps into tasks that can be completed in a day or two
- Include estimates where helpful
- Identify any unknowns or areas that need research
- Consider backwards compatibility and migration needs

# Avoid

- Making the plan too detailed (it will change as you learn more)
- Not considering the impact on existing functionality
- Forgetting about testing and deployment considerations

# Notes

- Use Australian/NZ English spelling and terminology throughout development plans
