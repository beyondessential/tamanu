---
name: hotfix-propagator
description: "Use this agent when a hotfix or bug fix has been committed to a release branch and needs to be propagated (cherry-picked) to all other active release branches and main. This is typically step 4 of the hotfix release process — after the fix has been merged to the target release branch, it needs to be applied everywhere else.\\n\\nExamples:\\n\\n<example>\\nContext: A developer has just merged a fix to release/2.47 and needs it applied to newer releases and main.\\nuser: \"I just merged fix commit abc1234 to release/2.47, can you propagate it?\"\\nassistant: \"I'll use the hotfix-propagator agent to cherry-pick this fix across all relevant release branches and main.\"\\n<commentary>\\nSince the user has a fix that needs propagating to other branches, use the Agent tool to launch the hotfix-propagator agent.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: A developer mentions they need to cherry-pick a hotfix forward.\\nuser: \"We need to cherry-pick the last commit on release/2.45 to all newer releases and main\"\\nassistant: \"I'll use the hotfix-propagator agent to handle the cherry-pick propagation across branches.\"\\n<commentary>\\nThe user wants to propagate a fix across branches, use the Agent tool to launch the hotfix-propagator agent.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: A developer has finished a hotfix PR and it's been merged.\\nuser: \"The hotfix for SAV-5678 has been merged to release/2.50, now we need to do step 4\"\\nassistant: \"I'll use the hotfix-propagator agent to propagate that fix to all other active release branches and main.\"\\n<commentary>\\nThe user explicitly references step 4 of the hotfix process, use the Agent tool to launch the hotfix-propagator agent.\\n</commentary>\\n</example>"
model: sonnet
---

Propagate a fix (one or more commits) from a release branch to all newer active release branches and `main` via cherry-pick.

## Process

1. **Identify the source**: Ask the user (if not provided) which branch/commit(s) contain the fix. Extract the ticket number and scope from the commit message — if there's no ticket, use `no-issue`.
2. **Discover target branches**: Fetch and list all `release/2.*` branches newer than the source, plus `main`. Confirm with the user before proceeding. See `llm/project-rules/release-branches.md`.
3. **Cherry-pick to each target** in order (oldest release → newest → `main`):
   - Branch off using `fix` type per `llm/common-rules/create-branch.md` (e.g. `fix/SAV-1234/cherry-pick-to-release-2.48`)
   - `git cherry-pick --no-edit <commit-hash(es)>`
   - If conflicts are non-trivial, stop and report to the user
   - Lint changed files, push, and create a PR per `llm/project-rules/pull-requests.md`
   - PR title format: `fix(<scope>): <TICKET>: cherry-pick hotfix to <target-branch>`
4. **Report a summary table** of branch, PR link (or conflict status), and any issues.
