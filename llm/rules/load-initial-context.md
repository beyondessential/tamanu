# Context

Use this rule when you are tagged in at the start of a chat to provide foundational knowledge about the Tamanu project. This should give you enough context to start working effectively without overwhelming the context window.

The loaded content is for your background knowledge only - you don't need to summarise or present any of it to the user unless they specifically ask about project details.

# Process

- Load the initial overview document: `llm/docs/initial-overview.md`
- Provide a brief summary of what's been loaded and what you are now ready to help with
- Load additional rules, styling constants, or specific context on-demand as needed during the conversation

# Structure

When loading initial context, present information in this order:

1. **Project Overview** - from the initial overview document
2. **Ready to Help** - what you can now assist with, mentioning that additional context will be loaded as needed

# Notes

- Use Australian/NZ English spelling and terminology when loading initial context
- Keep the initial load focused and concise to preserve context window space
- You should be ready to load additional specific context as needed during the conversation
- For styling tasks, key files are located at:
  - `packages/web/app/constants/styles.js` - web styling constants and colours
  - `packages/web/app/theme/theme.js` - Material-UI theme configuration
- Avoid verbose summaries of actions taken and items achieved at the end of conversations
- Remember and express outstanding actions that the user needs to perform or fix
