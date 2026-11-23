---
name: qa-loop
description: "Run an adversarial QA loop over this card's changes, fixing and re-checking until no bugs, edge cases or UI roughness are left"
label: "QA loop"
category: verify
workhorse-version: 0.8.0
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
- **Find, fix and re-check as `.agents/docs/running-loops.md` says** in "Finding, fixing and re-checking": a traced finding is reproduced before anything above low is fixed, every confirmed finding the tests did not cover gets a test written first (and is ticked in the card's test cases), a fix is not a feature, and no fix removes a safeguard. Put every settled decision through a security lens before it goes into a brief.
- **Report the run** as "Reporting the run" below says. The run holds the pull request itself, so you never call `hold_pr` or `release_pr`.
- **The log** is `.workhorse/plans/{card-id}/qa/log.md` (committed), and bulk reports go in the card's work directory (`workhorse-local rig workdir`, not committed).
- **Fixers are partitioned by area,** with the other areas' files named in each brief.
- **Leases** are named `--holder qa-loop/<its name>`.
- **Collect when the card lands** as well as each round, with `workhorse-local rig gc --card <card>`.

### Reporting the run

Report as `.agents/docs/running-loops.md` "Reporting a run" says, with `report_round` and `loop` `qa_loop` once per round, after the round's triage is set. File each confirmed finding with `file_issue` and a `severity` as you confirm it (blocker and high are `critical`, medium is `suggestion`, low is `nit`), once it has reproduced where it was only traced, and set its disposition with `set_issue_disposition` as the fixer fixes it or you decide it. When a round files five or more issues, call `set_triage` before any fix is started. Use `stopped` only if the user told you to stop.

### 0. Orient, once

0. **Prerequisites,** per `.agents/docs/running-loops.md`. A branch with no changes against its base and nothing uncommitted is "Nothing to do". Ask first when the card has no description or specs to test against, whether to draft them first or test against what the diff alone shows.
1. **Scope.** The card's branch against its base, as `.agents/docs/running-loops.md` "Scope" says, plus anything uncommitted; the files and surfaces it touches; the specs and the test-cases file for the card.
2. **Write the charter** at the top of the log:
   - the user-facing flows, each with who does it, the steps and what done looks like;
   - the API surface touched: endpoints, inputs, who may call them;
   - the data and state touched, including anything migrated;
   - the risks, ranked;
   - how to run the tests, and the typecheck, lint and build where the repo has them, from the repo's own guidance;
   - how to run the app (see `.agents/docs/browser-rig.md`).
3. **Baseline.** Run the full tests, and the typecheck, lint and build where the repo has them. A failure that was there before this branch is recorded as pre-existing and left alone. A failure the branch caused is the first finding.
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

**Briefs** follow `.agents/docs/running-loops.md`. An adversary's brief also carries "read the repository's agent guidance first", the charter, and how to take its own lease (`workhorse-local rig lease --holder qa-loop/<its name> --holder-pid parent`) and release it before reporting, and that it never builds, copies dependencies or starts a server itself.

### 2. Triage

Triage as `.agents/docs/running-loops.md` says, checking each traced finding has been reproduced. A finding that is really a taste or architecture call is decided by a Fable agent or by you, with the reason recorded so it is not reopened without new evidence.

### 3. Fix

One fixer per group, `sonnet`, or `opus` for concurrency, security and tangled areas. Each brief carries the findings, the decisions already made, the files the fixer owns and the files others own, and the instruction to write the failing test first, commit per finding, run the affected tests, tick the test case it covered, and report.

### 4. Re-check

This is what makes it a loop. For each batch of fixes, a fresh adversary that did not write the fix gets the diff of the fixes and the findings they answer, and is told to:

- break each fix, and look for what the fix itself broke;
- confirm the new test fails without the fix and passes with it;
- re-run the original reproduction;
- check the fix did not remove a safeguard, widen a permission or add a flow with no test.

Its findings enter the next round like any other. A fix that was not re-checked has not closed its finding.

### 5. Checkpoint

Run the checkpoint as `.agents/docs/running-loops.md` says, then move on.

### 6. When it is done

A round is **clean**, and a round is **cold**, as `.agents/docs/running-loops.md` says; a cold QA round also runs its lenses in a different order.

The loop is **done** when all of these hold:

- the rigour's clean rounds in a row;
- every lens has come back clean, and the architecture lens has run;
- every charter flow has passed in a real browser, or is listed as not verified with the reason;
- the API matrix passes;
- the last checkpoint is green;
- every confirmed finding has a committed test, or a recorded reason and a follow-up;
- nothing is open except follow-ups and decisions that are the user's.

The guards in `.agents/docs/running-loops.md` apply, so the loop converges rather than churns. One more is this loop's own: **raise the bar each round.** From round 3, tell each adversary which classes of bug have been found so far and ask for a different class, and give the Opus or Fable agent the question "what would every other lens miss?" A same area that keeps producing findings for three rounds gets an architecture review.

### 7. Report

Lead with the result, then:

- rounds run, the lenses and the models used;
- findings by severity: found, fixed, follow-up, won't fix;
- tests added, by level, and the test cases ticked;
- what was verified in a real browser and what was not, and why;
- what a reader should still not trust: the unverified, the residual risk, and the decisions that are theirs.

Say what the evidence is, as `.agents/docs/running-loops.md` says. Keep the test cases and the progress summary current (see `.agents/docs/progress-summary.md`).

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
