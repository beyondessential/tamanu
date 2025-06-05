# Context

This rule is for creating documentation that captures successful workflows and patterns discovered during LLM-assisted development sessions. When you've had a productive conversation with an AI assistant that resulted in solving a complex problem, implementing a feature, or establishing a good workflow, you should create a rule to preserve that knowledge for future reference.

This is especially valuable for:

- Repeatable development patterns that work well in your codebase
- Complex multi-step processes that involve multiple tools or files
- Solutions to common problems that might recur
- Workflows that have specific gotchas or requirements
- Any process where you've learned what NOT to do through trial and error

The goal is to turn successful one-off conversations into reusable documentation that can guide future development work.

# Process

- Look through the chat history for the current chat
- Produce a new .md file into the `llm_rules` within the root of the project (so it can be committed to version control)
- Summarise any relevant context from the conversation into a "# Context" section
- Produce a set of steps for each of the most common actions the user has been asking to perform. Put these in a "# Process" section
- Include any learnings about anti-patterns or places it went wrong to avoid in an "# Avoid" section

# Avoid

- Leaving out critical information

# Notes

See an example of the output at `./translate-hardcoded-strings.md`

# Paraphrased conversation transcript

- No background conversation for this rule
