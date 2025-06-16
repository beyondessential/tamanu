# Context

Create incident response documentation after working through a bug, outage, or production issue.

Use this for:

- Complex bugs that required significant investigation
- Production incidents that affected users
- Issues that revealed gaps in monitoring or alerting
- Problems that are likely to recur or have similar root causes
- Debugging processes that uncovered useful techniques

# Process

- After talking through an incident or complex bug, gather the key information from the conversation
- Create a new .md file in `llm/on-call/` with a descriptive name including the date (e.g., `2024-01-15-payment-timeout-issue.md`)
- Document whatever information will be helpful for future investigations - don't worry about following a rigid structure
- Include any of these sections that are relevant:
  - **Summary**: Brief description of the issue and impact
  - **Investigation Process**: Steps taken to diagnose the problem
  - **Root Cause**: What actually caused the issue (if determined)
  - **Resolution**: How the issue was fixed (if resolved)
  - **Useful Queries**: Any SQL or commands that helped with investigation
  - **Lessons Learned**: What was discovered during the process
  - **Related Issues**: Links to similar past incidents or tickets
  - **Useful SQL**: SQL queries that were generated and run. YOU MUST NEVER INCLUDE REAL DATA IN THESE. If there were e.g. ids pasted in, use 'x' or similar to indicate a placeholder.
- Include relevant code snippets, and error messages, for searchability. Again, NEVER INCLUDE ANY REAL DATA, i.e. redact anything from error messages that isn't generic.
- If you generated any useful SQL queries or commands during the session that aren't already in `llm/on-call/on-call-cheatsheet.md`, add them to the cheatsheet with appropriate context. YOU MUST NEVER INCLUDE REAL DATA IN THESE. If there were e.g. ids pasted in, use 'x' or similar to indicate a placeholder.
- Focus on capturing anything that would help future debugging sessions, even if incomplete

# Avoid

- Including sensitive data like passwords, personal information, patient data, or any real data at all
- Skipping documentation because the issue wasn't fully resolved
