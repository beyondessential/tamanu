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
- Add a "# Recent Updates" section at the end for tracking changes over time
- **ALWAYS include a "Self-Update After Usage" section** at the beginning of the Process section with these exact instructions:

  ```markdown
  ## Self-Update After Usage

  **IMPORTANT**: When this rule is used in a conversation, the AI should:

  1. **Complete the task** following the steps below
  2. **Observe what happened** during the session (new patterns, challenges, solutions)
  3. **Extract learnings** from the usage:
     - New successful patterns to add to Process section
     - New gotchas or anti-patterns for Avoid section
     - Better approaches that improve existing steps
     - Edge cases or context not previously covered
     - Corrections to existing guidance that proved incorrect
  4. **Update this rule file** by editing the appropriate sections with the new learnings
  5. **Document the update** AI must always add an entry in a "# Recent Updates" section with session date and what was learned
  ```

# Avoid

- Leaving out critical information
- Forgetting to include the Self-Update After Usage section in new rules
- Creating rules that are too vague about when they should be updated
- Not documenting what specific learning triggered an update

# Notes

See an example of the output at `./translate-hardcoded-strings.md`

Rules should be living documents that improve over time through actual usage, not static documentation that becomes outdated.
