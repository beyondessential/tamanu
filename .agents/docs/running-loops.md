---
workhorse-version: 0.7.10
---

# Running a loop of agents

The rules every orchestrated loop follows, whatever it loops over: `qa-loop`, `refactor-loop`, `design-loop` and `hands-free-feature` all cite this. Each skill names what is particular to it, such as its log's path, its holder name and which model does which of its jobs; everything else is here.

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

## Holding the pull request

A loop that works across turns before the branch is worth reviewing again calls `hold_pr` with a short reason as it starts, such as "QA loop running", and `release_pr` once its last change is pushed, including when it stops early. Your own turns already hold, but nothing does between two of them, so without a hold the review loop could request a round on a half-finished branch and an armed merge could fire. Where the tools are not available, carry on without them.

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
