# Context

Use this rule when you need to create a pull request title and description for work that's been completed on a feature branch.

The project requires conventional commit format for PR titles as outlined in CONTRIBUTING.md, and feature branches must include the Linear card number. Keep the tone casual and friendly - we're a NZ/Australian company with a relaxed but competent culture.

Use the project's PR template format from .github/pull_request_template.md.

# Process

- Check the current branch name to extract the card code (e.g., from `feat/NASS-1712-description`)
- Review the conversation history to understand what work was accomplished
- Use `git diff main --name-only | cat` to see all files changed since branching from main
- Use `git log --oneline main..HEAD | cat` to see commit messages for context on what was done
- Create a PR title in the format: `type: CARD-123: description`
- Use the same conventional commit type that matches the branch type and work done
- For the PR description, use the template format:
  - Fill in the "Changes" section with a brief description for reviewer context
  - Include key changes based on the full diff and commit history
  - Leave the checkboxes and other template sections as-is
- Write like you're explaining it to a colleague - use natural, conversational language
- Avoid corporate buzzwords and formal language that no one actually uses in conversation
- Keep it concise - reviewers can refer to the card for full context if needed
- Use present tense and focus on the changes made
- Present both the PR title and description as separate code blocks for easy copy-pasting
- If you've updated this rule during the process, commit those changes before generating the final PR

Example format:

```
**PR Title:**
```

doc: NASS-1712: restructure LLM system to capture institutional knowledge

```

**PR Description:**
```

### Changes

[Brief description of changes using natural, conversational language]

### Deploys

- [ ] **Deploy to Tamanu Internal** <!-- #deploy -->

### Tests

- [ ] **Run E2E Tests** <!-- #e2e -->

### Remember to...

- ...write or update tests
- ...add UI screenshots and **testing notes** to the Linear card
- ...add any **manual upgrade steps** to the Linear card
- ...update the [config reference](https://beyond-essential.slab.com/posts/reference-config-file-0c70ukly), [settings reference](https://beyond-essential.slab.com/posts/reference-settings-0blw1x2q), or any [relevant runbook(s)](https://beyond-essential.slab.com/topics/runbooks-bs04ml6c)
- ...call out additions or changes to **config files** for the deployment team to take note of

<!-- Thank you! -->

```

```

# Avoid

- Forgetting to include the card number in the title
- Using past tense in the title
- Corporate buzzwords and overly formal language (e.g., "systematic approach", "emerges during", "institutional knowledge")
- Writing lengthy explanations that duplicate card content
- Only looking at recent changes instead of the full branch diff
- Modifying the template structure or removing sections
- Forgetting to commit rule updates before generating the final PR

# Notes

- Use Australian/NZ English spelling and terminology in PR titles and descriptions
