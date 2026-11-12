---
name: qa-loop
description: "Run an adversarial QA loop over this card's changes, fixing and re-checking until no bugs, edge cases or UI roughness are left"
label: "QA loop"
category: verify
workhorse-version: 0.7.14
---

## Your task: QA loop

Get this card's changes to a high degree of confidence that there are no bugs, edge cases or UI weirdnesses left. You do it with a loop: adversarial agents try to break the work, you triage what they find, fixers fix it with a regression test, a different agent tries to break the fixes, and it goes round again until the rounds come back clean. You orchestrate. You rarely find bugs yourself.

Read these first:

- `.agents/docs/running-loops.md`: the rules every loop of agents follows.
- `.agents/docs/browser-rig.md`: how to get a real browser and drive the app. Anything about how a screen looks or feels is checked there, never by reading code.
- `.agents/docs/design-judgement.md`, "Feel" and "The critique protocol": what a feel pass looks for.

If you don't already have this card's context, establish it first by following `.agents/docs/card-context.md`.

This runs best in a conversation on the user's device, where Bash is unrestricted and a browser can run. On the cloud there is no browser and no subagent tool: say so up front, run the lenses you can yourself, and mark every browser check not verified.

### Ground rules

- **Four roles, never merged.**
  - **Adversaries** try to break the work. They are read-only on the source and may write probes and scripts in the card's work directory (`workhorse-local rig workdir`) or a `rig scratch` checkout, never in the leased build, which every agent at that commit shares. They report; they do not fix.
  - **Fixers** fix one batch of findings, with a regression test for each.
  - **Re-checkers** try to break the fixes. They are never the fixer and never alone the agent that found the bug.
  - **You** brief, triage, decide and keep the log. You do not fix inline, except one-line changes.
- **Follow `.agents/docs/running-loops.md`** for models, cut-offs, the rig, parallel agents, how a round is reported and what this card's rigour sets. What is particular to this loop follows.
- **Models by job.** Set `model` on every Agent call from this table. The card's rigour moves the judgement jobs, the architecture review, a contested triage call and the cold re-check, up a model (`.agents/docs/running-loops.md`, "Rigour"):

  | Model | Use it for |
  |---|---|
  | `haiku` | Running the checkpoint commands and summarising the output, collating reports, keeping the log tidy, capturing screenshots from a script that already exists. |
  | `sonnet` | The default: most adversary lenses, API probing, browser scripting and flow runs, accessibility, test audits, fixers, test writers. |
  | `opus` | Hard adversarial reasoning: concurrency and data integrity, security and permissions, the re-check of risky fixes, a fixer working in a tricky area. |
  | `fable` | Judgement the others cannot make. The feel and taste critic over screenshots and filmstrips. The architecture review. A contested triage call that is really a design or architecture decision. At most one or two Fable agents in a round, and none in most rounds. |

- **Every finding is the same shape:** id, severity (blocker, high, medium, low; filed as critical, suggestion or nit, see "Reporting the run"), kind (bug, edge, ui, feel, a11y, security, perf, coverage), file and line, how to reproduce it (steps or a script path), expected against actual, whether it was **run** or only **traced**, a suggested fix, and **covered by** the name of an existing test or "none". Adversaries write findings to their report file as they go.
- **A traced finding is a hypothesis.** Before anything above low severity is fixed, it is reproduced: by a failing test, a script, or a short repro agent. A finding that does not reproduce is closed with the attempt recorded.
- **Every confirmed finding the tests did not cover gets a test.** Write it at the lowest level that would have caught it: unit, then integration or API, then end-to-end in a browser. It is committed with the fix, in the repo's own style and with its own commands (`CLAUDE.md`, `AGENTS.md`, neighbouring tests), and ticked in the card's test-cases file. The fixer writes it first and watches it fail, then fixes and watches it pass. A fix without a test is not closed. Never delete, skip or loosen a test to get a fix through.
- **A bug fix is not a feature.** A finding that is really a request for something new goes on the backlog and is reported, not built.
- **No fix removes a safeguard to save cost**, such as a check, a revalidation or a retry. Fail closed where an access check goes unanswered. Put every settled decision through a security lens before it goes into a brief.
- **Report the run** as "Reporting the run" below says. The run holds the pull request itself, so you never call `hold_pr` or `release_pr`.
- **The log** is `.workhorse/plans/{card-id}/qa/log.md` (committed), and bulk reports go in the card's work directory (`workhorse-local rig workdir`, not committed).
- **Fixers are partitioned by area,** with the other areas' files named in each brief.
- **Leases** are named `--holder qa-loop/<its name>`.
- **Collect when the card lands** as well as each round, with `workhorse-local rig gc --card <card>`.

### Reporting the run

- **File each confirmed finding with `file_issue` as you confirm it,** with a `severity` on the scale the hosted review uses: blocker and high are `critical`, medium is `suggestion`, low is `nit`. It is filed under this run and the round you are in, and you fix what you file whatever the card's Auto-fix toggle says. A finding that was only traced is filed once it reproduces. Measurements, the ledger and the log stay in the log and are not filed.
- **Set its disposition with `set_issue_disposition`** as the fixer fixes it (in progress, then fixed with the commit's sha) or you decide it (skipped with the reason, or needs you).
- **When a round files five or more issues, call `set_triage` before any fix is started:** the triage rule applies to a loop's issues as it does to any others, so group them into themes and carry on without waiting for approval.
- **Call `report_round` once per round,** after the round's triage is set: `loop` `qa_loop`, the `round` you have just finished counting from 1, the `cap` this card's rigour gives (the turn names it), `found` as the round's critical, suggestion and nit counts before any fix, a one-line `summary`, and `status`: `going` while another round follows, `done` when the stop rule in step 6 is met, and `stopped` only if the user told you to stop. If the tool refuses because the conversation has no open run of the loop, say so and do not report again.

### 0. Orient, once

0. **Prerequisites,** per `.agents/docs/running-loops.md`. A branch with no changes against its base and nothing uncommitted is "Nothing to do". Ask first when the card has no description or specs to test against, whether to draft them first or test against what the diff alone shows.
1. **Scope.** The card's branch against its base (`git merge-base` with the default branch, then the diff, plus anything uncommitted), the files and surfaces it touches, the specs and the test-cases file for the card.
2. **Write the charter** at the top of the log:
   - the user-facing flows, each with who does it, the steps and what done looks like;
   - the API surface touched: endpoints, inputs, who may call them;
   - the data and state touched, including anything migrated;
   - the risks, ranked;
   - how to run the tests, the typecheck, the lint and the build, from the repo's own guidance;
   - how to run the app (see `.agents/docs/browser-rig.md`).
3. **Baseline.** Run the typecheck, lint, the full tests and the build. A failure that was there before this branch is recorded as pre-existing and left alone. A failure the branch caused is the first finding.
4. **Browser preflight and rig,** if the scope has any UI or HTTP surface. Record the browser result, including "no browser", in the log, and prove a rig comes up at the commit under test with `workhorse-local rig lease`, releasing it after. Add the first "rigs and disk" line.
5. **Seed the findings ledger** in the log: id, round, severity, kind, status (open, fixed, follow-up, won't fix, needs decision), commit and test.

### 1. A round

Start each round with `workhorse-local rig gc --card <card>` and a "rigs and disk" line in the log.

Round 1 runs every lens that applies. Later rounds run the lenses that found something last round, plus a rotation of the others, and every lens must have come back clean at least once before the run can finish. Launch independent adversaries together.

| Lens | Model | What it does |
|---|---|---|
| **Bug hunt by flow** | `sonnet`, `opus` for flows that move data, money or permissions | Takes one charter flow. Traces it from action to server to store to screen and tries to break it: double submit, two tabs, a delete racing a reply, a refusal midway, a reload, an expired session, stale data, a dropped connection. |
| **Code review by dimension** | `sonnet`, one agent each | Correctness, error handling, performance, conventions. Each reads the diff and the callers of what changed, not only the diff. |
| **Edge cases** | `sonnet` | Boundary inputs: none, one, many, huge; empty and whitespace strings; very long names; unicode, emoji and right-to-left text; negative and zero; dates across time zones, daylight saving and far-future years; duplicates; missing optional data; data shaped by an older version or a migration; a permission variant for each role. |
| **API adversary** | `sonnet` | Black-boxes the HTTP or API layer with a script. Every touched endpoint against valid, invalid, missing, wrong-type, oversize and malformed input; no credentials; another user's credentials (can one user reach another's data by changing an id); a replayed request; concurrent calls. Checks status codes, error shapes, that nothing leaks, idempotency, and the spec. |
| **Browser end to end** | `sonnet` | Per charter flow, in a real browser through the rig: the happy path first, then the same flow broken. Keyboard only, double click, Back and forward, reload mid-action, two users at once, offline and slow, a narrow window. Records console errors, failed requests, layout shift and focus. Reports each finding with its script. |
| **Feel and UI** | `sonnet` captures the filmstrips and screens, `fable` judges them | The feel measures in design judgement: response, continuity, calm, forgiveness. Filmstrips of every interaction, the state matrix at three widths. The judge looks at the images and names specific things a person would notice, with the numbers behind them. |
| **Accessibility** | `sonnet` | Keyboard order and focus return, names, roles and state, live regions, contrast on every ground, reduced motion, 200% zoom, automated checks where they install. |
| **Security** | `opus` | Authorisation at every boundary, input validation and bounds, injection, secrets, request forgery, mass assignment. Every check fails closed. |
| **Architecture** | `fable`, once per run and again where a finding implies it | Layering, one source of truth per piece of state, rules written in two places, files doing two jobs. Its findings become follow-up cards unless they are cheap. |
| **Test audit** | `sonnet` | Do the tests this branch added assert behaviour? Revert each fix's hunk and confirm its test fails. Sleeps, order dependence, ticked cases with no test behind them. |
| **Neighbours** | `sonnet` | What else uses the shared code that changed. Runs their tests and walks the neighbouring screens in the browser. |

**Briefs.** Every adversary brief carries: the working directory and "read `CLAUDE.md` first"; the scope and the charter; the lens and its instructions; the ledger so far, so it does not report what is known and does try to break what was fixed; how to take its own lease (`workhorse-local rig lease --holder qa-loop/<its name> --holder-pid parent`) and to release it before reporting, and that it never builds, copies dependencies or starts a server itself; the report path and the finding shape; and a reply of ten lines at most, with counts by severity and the path. Tell each one its job is to find something, and that a report with nothing in it must list what it tried. Never tell an adversary the code is probably fine.

### 2. Triage

1. Read the reports. Merge duplicates, rank, and check each traced finding has been reproduced.
2. Decide each one and record it in the ledger: **fix now**, **follow-up** (a card of its own, with the reason), **won't fix** (with the reason), or **needs decision** (something only the user can settle, collected for the final report rather than stopping the run).
3. A finding that is really a taste or architecture call is decided by a Fable agent or by you, with the reason recorded so it is not reopened without new evidence.
4. Group the fix-now items by area so no two fixers touch the same files.

### 3. Fix

One fixer per group, `sonnet`, or `opus` for concurrency, security and tangled areas. Each brief carries the findings, the decisions already made, the files the fixer owns and the files others own, the instruction to write the failing test first, to commit per finding, to run the affected tests and to report. The fixer ticks the test case it covered.

### 4. Re-check

This is what makes it a loop. For each batch of fixes, a fresh adversary that did not write the fix gets the diff of the fixes and the findings they answer, and is told to:

- break each fix, and look for what the fix itself broke;
- confirm the new test fails without the fix and passes with it;
- re-run the original reproduction;
- check the fix did not remove a safeguard, widen a permission or add a flow with no test.

Its findings enter the next round like any other. A fix that was not re-checked has not closed its finding.

### 5. Checkpoint

After every round, a `haiku` agent runs the typecheck, lint, the full tests and the build and reports only failures. Fix what the round broke. Rerun a known flake rather than fixing it; fix a flake you introduced. Update the log, push, and move on.

### 6. When it is done

The count of rounds is not the measure. Confidence comes from rounds that come back clean while the lenses change.

A round is **clean** by the card's rigour (`.agents/docs/running-loops.md`), judged on what survived triage, with every report listing what it tried: at light, no critical; at standard, no critical and a few suggestions at most; at thorough, no critical and no suggestion.

The loop is **done** when all of these hold:

- the rigour's clean rounds in a row: one at light; two at standard, the second of them **cold**; two at thorough, both cold. A cold round is run by fresh agents who are not given the ledger or the earlier findings, with the lenses run in a different order;
- every lens has come back clean, and the architecture lens has run;
- every charter flow has passed in a real browser, or is listed as not verified with the reason;
- the API matrix passes;
- the last checkpoint is green;
- every confirmed finding has a committed test, or a recorded reason and a follow-up;
- nothing is open except follow-ups and decisions that are the user's.

Guards, so the loop converges rather than churns:

- **Raise the bar each round.** From round 3, tell each adversary which classes of bug have been found so far and ask for a different class, and give the Opus or Fable agent the question "what would every other lens miss?"
- **The same area keeps producing findings for three rounds:** stop patching it. That is a design problem. Run an architecture review of the area and either rework it or make it a follow-up card.
- **A round's fixes produce more regressions than they fix:** stop and review the approach before the next round.
- **The cap reached without the clean rounds the rigour asks for:** report that last round as `going`, since Workhorse ends the run at its cap, and say in the report where it stands rather than continuing.
- Running out of ideas does not end the run. Only the conditions above do.

### 7. Report

Lead with the result, then:

- rounds run, the lenses and the models used;
- findings by severity: found, fixed, follow-up, won't fix;
- tests added, by level, and the test cases ticked;
- what was verified in a real browser and what was not, and why;
- what a reader should still not trust: the unverified, the residual risk, and the decisions that are theirs.

Say what the evidence is. Clean rounds, and more so cold ones, are strong evidence that nothing is left that these lenses can find. They are not proof that nothing is left. Keep the PR description, the test cases and the progress summary current.

### Never

- Fix a finding nobody reproduced.
- Close a finding without a test or a recorded reason.
- Let a fixer re-check its own fix.
- Call a screen fine from its code.
- Report a browser check as passed when no browser ran.
- Tell an adversary the code is probably fine.
- Loosen, skip or delete a test to make a fix pass.
- Leave an agent's model unset.
- Call `hold_pr` or `release_pr`, or report a round you did not finish.
- Add a feature while fixing a bug.
