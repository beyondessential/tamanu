# Context

Use this rule when you need to rebase or move an existing branch onto another one.

# Process

- Analyse the conversation context and reflog to understand which branches are being used currently
- If the current branch has a pull request open for it, prompt the user to confirm they want to rebase
- Use `git reflog` with an appropriate number of lines (e.g. `-n20`) to list the most recent changes
- Use `git branch --show-current` to find the current branch name
- Use `git log --oneline` with an appropriate number of lines (e.g. `-n20`) to understand context
- Run the git command `git rebase --onto` to rebase onto a branch

Example: `git rebase --onto feat/sync/streaming refactor/sync/mobile-stream`

# Avoid

- Using the older `git checkout` style of commands
- Fetching the upstreams: prefer to operate locally

# Notes

- Use Australian/NZ English spelling and terminology in branch names and all outputs
- Remind the user they need to change the base of a pull request after the rebase is complete
- If the rebase cannot happen cleanly and conflicts are hard to resolve, abort and revert to the user
