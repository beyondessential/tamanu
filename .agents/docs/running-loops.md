---
workhorse-version: 0.8.0
---

# Running a loop of agents

The rules every orchestrated loop follows, whatever it loops over: `qa-loop`, `refactor-loop`, `design-loop`, `build-loop` and `review-loop` all cite this. Each skill names what is particular to it, such as its log's path, its holder name and which model does which of its jobs; everything else is here.

## Models

- **Set `model` on every Agent call.** Left unset, every agent inherits your own model and the run costs several times what it should.
- **Match the model to how much judgement the job holds.** Where the decisions are already made, as in a settled brief, a survey, a scripted capture or a mechanical change, Sonnet carries it, and the more step by step the brief, the cheaper the model that can; Haiku runs commands and collates reports. Where the job is the judgement, as in planning, architecture, taste, or hard adversarial reasoning, use a stronger model, and reach for Fable there: it is the model for judgement the others cannot make, and a run that never uses it has usually settled for less.
- **Split a job that is both kinds.** A Sonnet agent drives the app and captures the screenshots, filmstrips or reports; the Opus or Fable judge receives only those.
- **Keep your own context small.** Read reports' summaries and the findings you must judge, not the code. Look at every screenshot that bears on a verdict yourself.

## Surviving cut-offs

A usage limit or a session ending stops every agent still running, so everything that matters lives on disk.

- Keep the loop's log under the card's plan folder, naming what is in flight and what comes next, so a fresh session can resume from it.
- Every brief tells its agent to commit per item and to write its findings to its report file as it goes.
- Relaunch a stopped agent from its last commit: "a previous run was cut off; check `git log` and `git status` and build on what is there".
- Run work you are waiting on as a foreground agent rather than ending your turn on a background one.
- Those per-item commits are the loop's record. In a Workhorse turn, the commit Workhorse makes when the turn ends holds only what is still uncommitted, such as the log's last lines, and there is none when nothing is (see `.agents/docs/checkout.md`). Push after each round's checkpoint so the card's branch shows where the run stands.

## Scope

A loop over the card's changes takes them as the card's branch against its base, not against the default branch: on a card based on a parent card, the default branch would take in the parent's work too. Find the base and diff against it as `.agents/docs/bases-and-dependencies.md` says, and add anything uncommitted in the worktree.

## Before the first round: prerequisites

Check that the loop can do its job before spending a round on it. Each skill names what it needs; the checks are the same in every loop and end one of three ways:

- **Nothing to do.** The loop cannot run or has no work: a QA loop on a branch with no changes, a refactor loop with no product code in scope. Call `report_round` with `status` `done`, `round` 1, `found` all zero and a `summary` that begins "Nothing to do" and gives the reason, then finish with a short note and do no more work, so the loops queued behind this one start without waiting.
- **Ask first.** The loop can run, but what it has to go on is thin or it looks premature: a card description too sparse to build or judge against, no specs where the loop would test against them, a design loop with no idea what the UI is for. Put the choice to the user with the question tool, naming the options and what each costs ("Start with a spec interview first, or go ahead with what the card says?"), and carry on with their answer. If they pick something other than this loop, end the run as `stopped` and say what to run instead. Ask only when the answer would change what you do, and ask once, before round 1: a loop asks nothing once it is going, and decides and records its assumption in the plan instead.
- **Go.** Everything it needs is there. Say nothing about it.

A loop picking up straight after another one (the next in a queue, or started in the conversation the last loop just finished in) does not ask: the person has just been through this card with the loop before, so it takes the option it would have recommended and records the assumption and why in the plan. A prerequisite it cannot assume past is a "Nothing to do" exit.

## Reporting a run

Each run of a loop is a run on the card: its row in the card's Loops bar, its rounds and its issues all come from what you report. Workhorse holds the pull request for the length of the run and lets it go when the run ends, so you never call `hold_pr` or `release_pr` in a loop.

- **`report_round`, once per round.** Call it as the round's triage is set, with `loop` (your skill id: `qa_loop`, `design_loop`, `refactor_loop`, `build_loop` or `review_loop`), `round` (the round you have just finished, counting from 1), `cap` (the most rounds this card's rigour allows this loop, from the table below and named in your turn), `found` (the round's `critical`, `suggestion` and `nit` counts, before you fixed any of it), `summary` (a line on what the round covered and found) and `status`. Use `going` while another round follows, `done` when your stop rule is met, and `stopped` only when the user told you to stop. The run ends at its cap: a round numbered at the cap with status `going` ends it there, so say where it stands in your report. The tool refuses when this conversation has no open run of the loop or the run has ended; say so and do not report again.
- **File each confirmed finding with `file_issue`,** with a `severity`, when you confirm it. It is filed under the run and the round you are in. You fix what you file whatever the card's Auto-fix toggle says, and you set its disposition with `set_issue_disposition` as you fix, skip or hand it on. Measurements, taste calls, ledgers and the round-by-round log stay in the loop's log and are not filed, since they are not defects to handle.
- **Triage a big round.** When a round files five or more issues, call `set_triage` before acting on any of them: the triage rule applies to a loop's issues as to any others.
- **The severity scale** is the hosted review's, so clean means the same in every loop: **critical** (must be fixed), **suggestion** (worth fixing, not critical) and **nit** (minor). The QA loop's blocker and high are critical, medium is suggestion and low is nit; the design loop's major is critical, moderate is suggestion and minor is nit.

### Outside a Workhorse turn

A turn begins a run by running the loop's skill. A session outside Workhorse begins one itself, through the Workhorse MCP, where the tools above take the card as an argument.

- Call `start_loop` with the loop and the card before round 1. It returns the run's name and its cap. It is refused while another loop runs on the card, naming that loop; say so to the user rather than waiting.
- Run `workhorse-local keep-alive <card>` in the background for as long as the run goes on. It keeps the run, and its hold on the pull request, alive. If it exits saying the run ended, the run is over: tell the user, and start another only if they want the work to go on.
- `report_round` reports to the run you started. When it is refused because someone stopped the run from the card, stop and tell the user.
- Where the Workhorse MCP is not available, run the loop without reporting, and give the rounds and findings in your report instead.

## Rigour

The card's rigour says how hard a loop tries. Your turn names it, with its sentence and your loop's cap. Each level sets the same four things for every loop:

| Rigour | Clean rounds in a row | A round is clean when | Judgement model | Cap: QA, design, build, refactor, review |
|---|---|---|---|---|
| Light | 1 | no critical | the model the loop started with (Sonnet by default) | 3, 3, 4, 2, 3 |
| Standard | 2, the second by fresh eyes | no critical and a few suggestions at most (three) | a stronger model (Opus) for judgement calls | 8, 6, 8, 4, 5 |
| Thorough | 2, both by fresh eyes, every lens | no critical and no suggestion | the strongest model (Fable) for every judgement | 12, 10, 12, 8, 8 |

Clean is judged on what survived triage. Fresh eyes are agents given neither the ledger nor the earlier findings. For the refactor loop a round is a survey and its clean rounds are clean surveys; for the review loop a round is one pass of its reviewers. A level changes how many clean rounds end the run, what clean allows, the cap and which model judges; the capture, fixing and mechanical jobs keep the models each skill's own table gives them.

## Finding, fixing and re-checking

The loops that hunt for defects (the QA loop, the review loop, and the build loop's package checks) share one shape. Each skill names its own lenses, roles and models.

- **Roles are never merged.** Finders (adversaries or reviewers) report and do not fix. Fixers fix one batch of findings. Whoever re-checks a fix is never the agent that made it. You brief, triage, decide and keep the log, and fix inline only a one-line change.
- **Briefs.** Every brief carries the working directory and where the repository's guidance is, the scope, the agent's lens, the ledger so far (so it does not report what is known, and does try to break what was fixed), the report path and the shape of a finding, and a reply of ten lines at most with counts by severity. Tell each finder its job is to find something, and that a report with nothing in it lists what it tried. Never tell one the code is probably fine.
- **A finding is real before it is fixed.** A finding that was only traced, or only claimed, is a hypothesis: before anything above a nit is fixed, confirm it against the code or reproduce it. One that does not hold is closed with the attempt recorded, and the reason goes into the next round's briefs so it is not raised again.
- **Triage.** Merge duplicates, rank, and decide each finding: fix now, skip or won't fix (with the reason), follow-up (separate work, recorded as needing a card), or needs decision (something only the user can settle, collected for the report rather than stopping the run). Group the fix-now items by area so no two fixers touch the same files.
- **A defect's fix comes with a test.** The fixer writes the test first, at the lowest level that would have caught the defect, watches it fail, fixes, and watches it pass, then commits per finding in the repository's own style. Never delete, skip or loosen a test to get a fix through. A fix that removes a safeguard to save cost, such as a check, a revalidation or a retry, is re-checked before it lands.
- **A fix is not a feature.** A finding that is really a request for something new goes on the backlog and into the report, not into the code.
- **Checkpoint.** After every round, a `haiku` agent runs the repository's checks (its tests, and its typecheck, lint and build where it has them) and reports only failures. Fix what the round broke. Rerun a known flake rather than fixing it, and fix a flake you introduced. Update the log and push.

### When it is done

- A round is clean by the card's rigour (see "Rigour"), judged on what survived triage, with every report listing what it tried. A **cold** round is one run by fresh agents given neither the ledger nor the earlier findings.
- The number of rounds is not the measure. Running out of ideas does not end a run; only the skill's stop rule and the cap do.
- **The same area keeps producing findings:** stop patching it. Treat it as a design problem: review the area's design, then rework it or record it as a follow-up.
- **A round's fixes cause more findings than they close:** stop and review the approach before the next round.
- **A finding comes back after it was skipped:** the finder has no memory of the decision, so put the reason in its brief rather than changing the code to quieten it.
- **The cap is reached without the clean rounds the rigour asks for:** report that round as `going`, since Workhorse ends the run at its cap, and say in the report where it stands.
- In the report, say what the evidence is. Clean rounds, and cold ones more so, are strong evidence that nothing is left these lenses can find. They are not proof that nothing is left.

## The rig

`.agents/docs/browser-rig.md` has the detail. In short:

- **Lease, never build.** Commit the work under test, then every agent that needs the running app takes its own lease with `workhorse-local rig lease --holder <loop>/<role> --holder-pid parent` and releases it before it reports. The first lease at a commit builds it once and every other agent reuses that build. No agent builds its own copy, copies dependencies, or starts its own database or server; a fake service it must run binds to `127.0.0.1`. Throwaway checkouts come from `workhorse-local rig scratch`.
- **Long runs renew.** A lease ends when its time runs out even while its holder is alive, so an agent that may run longer than an hour leases with `--ttl 4h` or renews with `workhorse-local rig renew <lease>`.
- **No recipe, write one.** If the lease fails with `no-recipe`, write the recipe (browser rig, "When the repository has no rig recipe"), commit it, and carry on.
- **Disk is part of the loop.** Run `workhorse-local rig gc --card <card>` at the start of every round, never the plain machine-wide form, and keep a "rigs and disk" line in the log: free space, leases outstanding, the card's use against its budget, and the rigs' memory against the cap (`workhorse-local rig status`). A build refused for low disk, or a lease refused because rig memory stayed full, is a result to report, not an obstacle to work around.
- **No browser, say so.** If no browser can run, say so in the log and the report, and treat every visual and feel claim as unverified.
- **Never keep a rig under `/tmp`,** where the operating system cleans it away mid-run.

## Parallel agents in one worktree

- Each agent commits only its own paths with `git commit -F <file> -- <paths>`. Never `--amend`, `git add -A` or `git stash`.
- Partition agents by area so no two touch the same files, and name in each brief the files the others own.
