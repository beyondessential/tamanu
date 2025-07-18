# What's this for? (devs)

Create and update documentation when exploring areas of the codebase to preserve institutional knowledge for future LLM sessions.

# Context

Use this rule when you need to create context documentation for a specific area of the codebase that you've been exploring during a development session.

This helps capture the understanding you've built up about how different parts of the system work together.

# Process

## For New Documentation:

- After exploring a new area of the codebase, identify the key insights from the conversation
- Create a new .md file in `llm/docs/` with a descriptive name (e.g., `user-authentication.md`, `payment-processing.md`)
- Structure the document with these sections:
  - **Overview**: High-level description of what this area does
  - **Key Components**: Main files, classes, or modules involved
  - **Architecture**: How the pieces fit together
  - **Data Flow**: How information moves through the system
  - **Important Patterns**: Common approaches used in this area
  - **Gotchas**: Things that commonly cause confusion or bugs
  - **Related Areas**: Other parts of the codebase that interact with this
  - **Useful Commands**: Any specific scripts, queries, or tools for this area

## For Updating Existing Documentation:

- Check `llm/docs/` to find the relevant existing document
- Review the current content to understand what's already documented
- Update the relevant sections with new information:
  - Add new items to existing lists
  - Update architecture diagrams or descriptions
  - Correct any outdated information
  - Add new sections if needed (but keep it focused)

## For Both:

- Include code examples where helpful, but keep them concise
- Link to relevant files using relative paths
- Write for future LLM sessions - focus on what an LLM needs to know to work effectively in this area

# Avoid

- Creating docs that are too broad
- Including outdated information without verification
- Not linking to actual code files being discussed

# Notes

- Use Australian/NZ English spelling and terminology throughout context documentation
