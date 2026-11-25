---
workhorse-version: 0.8.0
---

# Workhorse

Workhorse is a spec-driven development workbench. Work is done on cards: a card is a unit of work with its own branch, its specs (the acceptance criteria, under `specs/`), and the conversations in which people and agents shape and build it. Cards are grouped into projects inside a workspace, which holds one or more repositories.

You may be working a card in a Workhorse turn, where Workhorse gives you the card's context and its tools, holds the card's pull request while you work, and commits your changes when the turn ends. Or you may be in a session of your own outside Workhorse, such as Claude Code, where the same tools are reached through the Workhorse MCP server where it is set up. The docs below say where the two differ.

These docs are written for agents and read as well by people, so point a user at the one that answers their question.

## How Workhorse works

- `.agents/docs/checkout.md`: the card's worktree and branch, and how its commits are made.
- `.agents/docs/pull-requests.md`: who opens, titles, reviews and merges the card's pull request, how follow-up pull requests and their branches work after a merge, and holding the pull request while work is part-way through.
- `.agents/docs/card-issues.md`: the card's issues, where they come from, and the tools for reading, triaging, fixing and filing them.
- `.agents/docs/card-artefacts.md`: the plan, test cases, breakdown, working doc, mockups and handoff, and which of them are card scratch.
- `.agents/docs/bases-and-dependencies.md`: what a card's branch is based on, and how to find that base for a diff.
- `.agents/docs/breakdown-format.md`: how a card breakdown is written.

## Shared guidance

- `.agents/docs/spec-format.md`: how specs are written and organised, and when to edit, fold, create or split one.
- `.agents/docs/working-doc-format.md`: the shape and voice of a card's working doc.
- `.agents/docs/design-sourcing.md`: where a mockup's or UI change's visual language comes from, and keeping unchanged parts of a screen as they are.
- `.agents/docs/design-judgement.md`: deciding features and the bar for taste.
- `.agents/docs/flagship-surface-playbook.md`: building a surface to a reference standard.
- `.agents/docs/running-loops.md`: the rules every loop of agents follows.
- `.agents/docs/browser-rig.md`: getting a real browser and a running copy of the app.
- `.agents/docs/git-reconcile.md`: bringing a branch up to date with its remote or its base, and checking for soft conflicts.
- `.agents/docs/progress-summary.md`: keeping the card's progress summary current.
- `.agents/docs/project-surface.md`: what a conversation on a project may change.
- `.agents/docs/asking-questions.md`: asking the user a question.
- `.agents/docs/card-context.md`: finding out which card you are on when no Workhorse turn has said.

Skills are under `.agents/skills/`: for a task, read the skill whose folder name matches it.
