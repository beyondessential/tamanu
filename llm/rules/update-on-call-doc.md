# Context

Update existing incident response documentation when new information becomes available or when similar issues recur. Use this when you need to add details to existing on-call documentation rather than creating new documentation.

# Process

- Identify the existing on-call document in `llm/on-call/` that needs updating
- Read the existing document to understand current content and structure
- Add new information following the same section structure as documented in `generate-on-call-doc.md`
- If you discovered new useful queries during the update process, also add them to `llm/on-call/on-call-cheatsheet.md`
- Maintain the same data handling standards: NEVER include real data, use placeholders instead

# Avoid

- Removing existing information without being certain it's incorrect
- Including real data in updated queries or examples
