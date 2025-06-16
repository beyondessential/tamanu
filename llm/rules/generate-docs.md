# Context

Create or update documentation when exploring areas of the codebase during development sessions to capture institutional knowledge.

Use this for:

- Complex business logic that isn't immediately obvious from code
- System architecture and how components interact
- Common patterns and conventions used in specific areas
- Gotchas, edge cases, and things that commonly trip people up
- Database schemas and data relationships

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
  - **Undocumented Areas**: Related functionality that exists but isn't covered (only if relevant)
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
