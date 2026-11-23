# Sync groundwork ledger: brief for verifiers

Working material for card P14 (sync documentation for coding and review agents). Each file in this folder checks one area of the sync system against the code. Nothing here is the final documentation; it is the evidence the documentation will be written from.

## Source

- A cleaned transcript of three sessions in which the original developer of sync walks another developer through it: `/Users/edwin/.workhorse/attachments/5fa86266-cd90-4141-b0e0-46d0433d76d4/sync-orientation-cleaned.md` (about 1,400 lines, with `### HH:MM:SS` headings inside `## Part 1`, `## Part 2`, `## Part 3`).
- The speaker says several times that their memory is stale and that parts of the code were written by others. Treat every statement as a claim to check, not as fact. The transcript's value is the *why*; the code is the authority on the *what*.
- The code is this worktree at main, commit `22d3edaa36`. Line numbers are as of that commit.
- Existing specs in `specs/sync/` and support runbooks in `docs/runbooks/sync-*.md` are also worth reading for your area.

## Rules

- Read-only on everything except your own ledger file. Do not edit code, do not run git commands that change state (no commit, checkout, stash, reset, fetch), do not start servers or run test suites.
- This repository is public. Do not write the names of deployments, countries, sites or hospitals from the transcript into your file; say "a large deployment" or similar. Refer to past work by PR number, not by person.
- Do not copy long stretches of the transcript. Paraphrase each claim in one or two sentences and cite its timestamp.
- Australian/NZ English. No em-dashes.

## Method

1. Read your assigned transcript ranges in full, plus a little either side for context.
2. Extract every factual claim about how sync works or why it works that way (from either speaker), every correction, and every "to check" or open question. Do not skip claims because they look obviously true.
3. Check each against the code. A claim is `confirmed` only if you have read the code that does it. Follow calls into helpers rather than trusting names.
4. For database functions and triggers defined in migrations, find the *current* definition: grep the function name across `packages/database/src/migrations/` (including `000_baseline.sql`) and take the latest by timestamp prefix. Say which migration it is.
5. Chase the why. Where a code comment, test name, or PR explains the reason for something, capture it. For reasons not in the code, use `git log -S'<string>' -- <path>`, `git blame -L`, then `gh pr view <number> --json title,body` on the PR number in the commit subject. Mark anything you infer rather than read as `inference`.
6. Note what the transcript did not mention but a developer changing this area would need to know: guards, assertions, invariants stated in comments, tests that pin behaviour, settings that change behaviour.

## Entry format

Use your area prefix for IDs (given in your task), numbered in transcript order.

```markdown
### CLK-07 Central keeps the tock and gives the tick to the client
Source: Part 1 00:10:51
Verdict: confirmed | partly | wrong | outdated | unverifiable
Evidence: `packages/central-server/app/sync/CentralSyncManager.js:120-134` what the code does there, in a sentence. Quote at most three decisive lines when the wording matters.
Why: the reason, with where you found it (code comment at path:line, PR #1234, or `inference`).
Notes: nuance, drift from the transcript, related guard or test.
```

Paths are relative to the repository root, always with a line or line range. Give every location that matters, not just the first.

## File layout

```markdown
# <Area>

## Drift
The claims that are wrong, outdated or only partly right, one line each with the ID. This is the first thing read.

## Claims
The entries, in transcript order.

## Open questions answered
Each "to check" or question raised in your ranges, with the answer and evidence. Say plainly when the code does not settle it.

## Not in the transcript
What a developer changing this area needs to know that nobody said. Same evidence standard.

## Unresolved
What you could not determine, and what you would look at next.
```

## What to send back

A message of at most 400 words: verdict counts; each wrong, outdated or partly-right claim in one line; the answers to the open questions; anything that surprised you; and what is unresolved. The detail lives in your file.
