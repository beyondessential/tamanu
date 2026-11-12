---
workhorse-version: 0.7.14
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

## Rigour

The card's rigour says how hard a loop tries. Your turn names it, with its sentence and your loop's cap. Each level sets the same four things for every loop:

| Rigour | Clean rounds in a row | A round is clean when | Judgement model | Cap: QA, design, build, refactor, review |
|---|---|---|---|---|
| Light | 1 | no critical | the model the loop started with (Sonnet by default) | 3, 3, 4, 2, 3 |
| Standard | 2, the second by fresh eyes | no critical and a few suggestions at most (three) | a stronger model (Opus) for judgement calls | 8, 6, 8, 4, 5 |
| Thorough | 2, both by fresh eyes, every lens | no critical and no suggestion | the strongest model (Fable) for every judgement | 12, 10, 12, 8, 8 |

Clean is judged on what survived triage. Fresh eyes are agents given neither the ledger nor the earlier findings. For the refactor loop a round is a survey and its clean rounds are clean surveys; for the review loop a round is one pass of its reviewers. A level changes how many clean rounds end the run, what clean allows, the cap and which model judges; the capture, fixing and mechanical jobs keep the models each skill's own table gives them.

## The rig

`.agents/docs/browser-rig.md` has the detail. In short:

- **Lease, never build.** Commit the work under test, then every agent that needs the running app takes its own lease with `workhorse-local rig lease --holder <loop>/<role> --holder-pid parent` and releases it before it reports. The first lease at a commit builds it once and every other agent reuses that build. No agent builds its own copy, copies `node_modules`, or starts its own database or server; a fake service it must run binds to `127.0.0.1`. Throwaway checkouts come from `workhorse-local rig scratch`.
- **Long runs renew.** A lease ends when its time runs out even while its holder is alive, so an agent that may run longer than an hour leases with `--ttl 4h` or renews with `workhorse-local rig renew <lease>`.
- **No recipe, write one.** If the lease fails with `no-recipe`, write the recipe (browser rig, "When the repository has no rig recipe"), commit it, and carry on.
- **Disk is part of the loop.** Run `workhorse-local rig gc --card <card>` at the start of every round, never the plain machine-wide form, and keep a "rigs and disk" line in the log: free space, leases outstanding, the card's use against its budget, and the rigs' memory against the cap (`workhorse-local rig status`). A build refused for low disk, or a lease refused because rig memory stayed full, is a result to report, not an obstacle to work around.
- **No browser, say so.** If no browser can run, say so in the log and the report, and treat every visual and feel claim as unverified.
- **Never keep a rig under `/tmp`,** where the operating system cleans it away mid-run.

## Parallel agents in one worktree

- Each agent commits only its own paths with `git commit -F <file> -- <paths>`. Never `--amend`, `git add -A` or `git stash`.
- Partition agents by area so no two touch the same files, and name in each brief the files the others own.
