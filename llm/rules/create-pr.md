# Context

Use this rule when you need to create a pull request title and description for work that's been completed on a feature branch.

Use conventional commit format for PR titles, and feature branches should include the task/card number. Keep the tone professional but friendly.

# Process

- Check the current branch name to extract the task/card code (e.g., from `feat/PROJ-1712-description`)
- Review the conversation history to understand what work was accomplished
- Use `git diff main --name-only | cat` to see all files changed since branching from main
- Use `git log --oneline main..HEAD | cat` to see commit messages for context on what was done
- Create a PR title in the format: `type: TASK-123: description`
- Use the same conventional commit type that matches the branch type and work done
- For the PR description:
  - Start with a brief description of changes for reviewer context
  - Include key changes based on the full diff and commit history
  - Follow any project-specific PR template if available
- Write like you're explaining it to a colleague - use natural, conversational language
- Avoid corporate buzzwords and overly formal language
- Keep it concise - reviewers can refer to the task/card for full context if needed
- Use present tense and focus on the changes made
- Add agentic label to PR description: Include `{agentic: [MODEL_NAME]}` at the end
- Check for CLI tools and create PR automatically if available:
  - Test for `gh` first: `which gh > /dev/null 2>&1 && echo "gh available"`
  - If gh is available, use: `gh pr create --title "PR_TITLE" --body "PR_DESCRIPTION"`
  - If gh is not available, test for `hub`: `which hub > /dev/null 2>&1 && echo "hub available"`
  - If hub is available, use: `hub pull-request -m "PR_TITLE" -m "PR_DESCRIPTION"`
  - If neither tool is available, present the PR title and description as separate code blocks for manual creation
- If you've updated any rules during the process, commit those changes before generating the final PR

Example format when CLI tools are not available:

```
**PR Title:**
```

doc: PROJ-1712: restructure LLM system to capture knowledge

```

**PR Description:**
```

### Changes

[Brief description of changes using natural, conversational language]

[Include any additional sections based on project's PR template]

{agentic: [MODEL_NAME]}

```

```

# Avoid

- Forgetting to include the task/card number in the title
- Using past tense in the title
- Corporate buzzwords and overly formal language
- Writing lengthy explanations that duplicate task/card content
- Only looking at recent changes instead of the full branch diff
- Forgetting to commit rule updates before generating the final PR
- Using CLI tools without first checking if they're available
- Not properly escaping quotes in PR titles/descriptions when using CLI tools

# Notes

- Adapt the title format and description structure to match project conventions
- Follow any existing PR templates in the project
- Adjust language style to match team culture
