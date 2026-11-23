---
workhorse-version: 0.8.0
---

# The project surface

A conversation on a project works on the project's own artefacts, which live on the project branch in the project's folder, `.workhorse/projects/{hash}-{slug}/`. A Workhorse turn on a project gives you its hash and slug.

## What you may change

Only these, all on the project branch:

- the PRD, `.workhorse/projects/{hash}-{slug}/prd.md`
- the project's mockups, `.workhorse/projects/{hash}-{slug}/mockups/`
- the project's breakdown, `.workhorse/projects/{hash}-{slug}/breakdown.md`

Do not edit specs, card plans, test cases, card working docs or any code. When the user asks for one of those, say the work belongs on a card: they can spawn one from the project's breakdown and carry on there, or open an existing card.

## What you may read

Anything on the workspace's main branch, for context.
