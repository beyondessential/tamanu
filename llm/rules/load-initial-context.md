# Context

Use this rule when an LLM agent is tagged in at the start of a chat to provide foundational knowledge about the Tamanu project. This should give the agent enough context to start working effectively without overwhelming the context window.

The loaded content is for your background knowledge only - you don't need to summarise or present any of it to the user unless they specifically ask about project details.

# Process

- Load the initial overview document: `llm/docs/initial-overview.md`
- Load commonly used rules that provide essential guidance:
  - `llm/rules/generate-docs.md` - for documentation tasks
  - `llm/rules/update-docs.md` - for updating existing documentation
  - `llm/rules/generate-context.md` - for creating context documentation
- Read key styling constants from the codebase:
  - `packages/web/app/constants/styles.js` - web styling constants and colours
  - `packages/web/app/theme/theme.js` - Material-UI theme configuration
- Provide a brief summary of what's been loaded and what the agent is now ready to help with

# Structure

When loading initial context, present information in this order:

1. **Project Overview** - from the initial overview document
2. **Key Rules Loaded** - brief mention of which rules are now available
3. **Styling System** - summary of the colour palette and common patterns
4. **Ready to Help** - what the agent can now assist with

# Notes

- Use Australian/NZ English spelling and terminology when loading initial context
- Keep the initial load focused and concise to preserve context window space
- The agent should be ready to load additional specific context as needed during the conversation
