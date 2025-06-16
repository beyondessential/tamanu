# Context

Update existing LLM rules when workflows evolve or new insights are discovered. Use this when you need to refine, expand, or correct existing rule documentation rather than creating entirely new rules.

# Process

- Identify the existing rule in `llm/rules/` that needs updating
- Read the existing rule to understand current workflow and requirements
- Update following the same structure as documented in `generate-rule.md`
- Maintain the same writing style - direct instructions to the LLM using "you"
- Ensure all steps remain actionable for the LLM

# Avoid

- Removing workflow steps without being certain they're no longer needed
- Adding vague instructions that aren't actionable for the LLM
