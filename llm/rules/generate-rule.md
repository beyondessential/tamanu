# Context

Create a rule to preserve successful workflows when you've had a productive conversation that resulted in solving a complex problem or establishing a good development pattern.

Use this for:

- Repeatable development patterns that work well in this codebase
- Complex multi-step processes that involve multiple tools or files
- Solutions to common problems that might recur
- Any process where you've learned what NOT to do through trial and error

# Process

- Look through the current chat history for valuable patterns and workflows
- Create a new .md file in `llm/rules/` with a descriptive name (e.g., `debug-sync-issues.md`, `update-database-schema.md`)
- Structure the rule document with these sections:
  - **Context**: When and why this rule should be used (be specific about triggers)
  - **Process**: Step-by-step instructions for the LLM to follow
  - **Avoid**: Common pitfalls, anti-patterns, or mistakes to prevent - only include things that actually came up in the conversation, don't add generic bullet points
- Write instructions directly for the LLM (use "you" to address the LLM)
- Include specific commands, file paths, and code patterns where relevant
- Make the process actionable - each step should be something the LLM can execute
- Focus on what the LLM needs to know, not what humans need to understand

# Avoid

- Writing rules that are too vague about when they should be applied
- Creating steps that aren't actionable for an LLM
- Making rules too broad or complex
- Adding bullet points to the Avoid section just for the sake of it - only include what's genuinely relevant
