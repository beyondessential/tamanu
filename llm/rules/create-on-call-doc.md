# Context

Use this rule when creating or updating on-call documentation based on incidents, troubleshooting sessions, or operational knowledge discovered during development.

This helps build up the institutional knowledge needed for effective on-call support.

# Process

- Review the conversation history for operational insights, troubleshooting steps, or incident resolution
- Determine if this should be added to the existing `llm/on-call/on-call-cheatsheet.md` or if a new document is needed
- For the main cheatsheet, add new sections or update existing ones:
  - **Common Issues**: New problems and their solutions
  - **Troubleshooting Steps**: Diagnostic procedures that worked
  - **Useful Commands**: Commands that helped resolve issues
  - **System Monitoring**: New things to watch for
- For new documents, structure with:
  - **Overview**: What this covers
  - **Symptoms**: How to recognise this issue
  - **Diagnosis**: Steps to confirm the problem
  - **Resolution**: How to fix it
  - **Prevention**: How to avoid it happening again
- Include specific commands, log locations, and error messages
- Write for someone who might be dealing with this at 3am
- Test any commands or procedures if possible

# Avoid

- Creating documentation that's too theoretical
- Missing critical details like exact commands or file paths
- Not including enough context about when to use these procedures

# Notes

- Use Australian/NZ English spelling and terminology throughout on-call documentation
