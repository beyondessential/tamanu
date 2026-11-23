---
name: build-loop
description: "Build this card from its specs to a working feature, then refine it in rounds until a full round finds nothing to add, change or cut"
label: "Build loop"
category: build
workhorse-version: 0.8.0
---

## Your task: build the feature, then refine it in rounds

Take this card from its specs to a working feature, then go round it again and again: use the result, and add what the user's work needs, change what is not working, and cut what does not earn its place. You decide what the feature should do as well as how it is built. You have hours; spend most of them using the result and making it better.

This is one loop of several. Verifying the whole branch is the QA loop's job, shrinking the code is the refactor loop's, reviewing the finished branch the way the hosted review will is the review loop's, and design where the surface needs it is the design loop's. You build, and you report every round.

Read these before anything else:

- `.agents/docs/running-loops.md`: the rules every loop follows, including how you report a round, the severity scale and what this card's rigour sets.
- `.agents/docs/design-judgement.md`: deciding features and the bar for taste. Feature rounds follow its "Deciding features".
- `.agents/docs/flagship-surface-playbook.md`: the method in detail, covering work packages, the polish loop and parallel agents.
- `.agents/skills/explore-backend/SKILL.md`: the method of a backend round.
- `.agents/skills/qa-loop/SKILL.md`, "The lenses" and "Findings, fixes and tests": how a package is verified. You follow it rather than inventing reviews of your own.
- `.agents/docs/browser-rig.md`: how to get a browser and drive the app.
- `.agents/skills/design-loop/SKILL.md`: the references, direction and polish steps you call where the work needs design.

If you don't already have this card's context, establish it first by following `.agents/docs/card-context.md`.

### Ground rules for the run

- **Two kinds of round, never mixed.** A feature round decides what the product does: it adds, changes and cuts features. A polish round makes what exists right: it subtracts and corrects, and never adds. Both loop just as hard. Mixing them is how runs go wrong: features slip in alongside fixes, and none of them gets its own design, review or polish.
- **Keep a feature ledger** in the plan:
  - **Asked:** the user's own ask. Fixed. You may refine how it works, never drop it.
  - **In:** what you decided to build, each item with the job it serves and the evidence for it.
  - **Changed and cut:** what you reshaped or removed, and why.
  - **Backlog:** candidates for the next feature round.
  - **Out:** what you decided against, with the reason. Anything the user ruled out is fixed here.

  You move items between these lists, but only in a feature round, and every move is recorded with its reason so the user can overrule it later.
- **Fence the shared components.** List in the plan the shared components you expect to change. Changing any other one needs a reason in the plan and a before-and-after screenshot of every place it appears.
- **Follow `.agents/docs/running-loops.md`** for models, cut-offs, the rig and parallel agents. For this run: Sonnet builds the work packages, and planning, the hardest spike and the technical design review go to you or a stronger agent. Leases are named `--holder build-loop/<role>`. The loop log is `.workhorse/plans/{card-id}/build/log.md`.
- **Test the backend as hard as the screens.** A feature's server side (its entry points, access checks, data model, migrations and background work) gets its own exploratory rounds, run against the rig with seeded edge-case data, not only the per-package lenses and the walkthroughs that reach it through the UI. Once polish findings are only at the edges (a tap target, a hyphen), stop polishing and spend the time on the backend.
- **Every substantive finding becomes an automated test,** wherever it was found: a package check, a backend round, a walkthrough or a critique. The rule in `.agents/docs/running-loops.md` "Finding, fixing and re-checking" applies to all of them: a test at the lowest level that would have caught it, failing before the fix and passing after, committed with the fix. A fix without one is not finished.
- **Write less code.** Before writing a component, function or helper, look for one the codebase already has. Track the branch's line count in the plan as the run goes. Shrinking it afterwards is the refactor loop's job, so leave the code readable and do not golf it.
- **Ask once, at the start, without stopping.** The only question you ask is for references (step 1), when the work needs design, together with anything that truly blocks. After that, decide, and record each decision and its reason in the plan, where the user can overrule it later.

### Reporting: rounds, findings and the stop rule

A round is one feature round together with the polish and backend rounds that follow it until they converge. Building the first version (steps 1 to 4) comes before round 1 and is not a round.

- **Report as `.agents/docs/running-loops.md` "Reporting a run" says,** with `report_round` and `loop` `build_loop` once per round, when its feature, polish and backend work are done. File each confirmed finding with `file_issue` and a `severity` as you confirm it, mapped as that doc says, and set its disposition with `set_issue_disposition` as you act on it. When a round has filed five or more issues, call `set_triage` before fixing any of them. Use `stopped` only if the user told you to stop.
- **What is filed:** a feature the feature round judges worth taking, and a change or cut it decides on, is filed as a suggestion. Work that goes on the backlog or the Out list, measurements and the ledger stay in the log and are not filed.
- **The stop rule** comes from the card's rigour (see `.agents/docs/running-loops.md`). A round is clean when its feature round found nothing to add, change or cut, its backend round found nothing, and what the polish and backend rounds filed is within what the rigour allows.

### 1. Brief, references and scope

0. **Prerequisites,** per `.agents/docs/running-loops.md`. Ask first when the card's description and specs are too thin to build from: start with a spec interview, or go forward with what is there. A card with nothing left to build is "Nothing to do".
1. Write the brief into the plan, using the template at the top of the playbook.
2. List the jobs the surface exists for, three to six of them, each naming who does it, when, and what done looks like. Feature rounds walk these jobs, so make them concrete: "a support lead sees which tickets will miss their deadline today and reassigns them", not "manage tickets".
3. **Decide whether the work needs design.** It does when it adds a surface, changes a layout, or adds controls or states that no pattern in the app already covers. It does not when it is backend or data work behind surfaces that already look right, or when its UI follows a pattern the app already has. Record the call and its reason in the plan. Without design, new UI follows the neighbouring surfaces. A feature batch that adds a surface or changes a layout brings design back for that batch.
4. Where the work needs design, start the design loop's references step now (`design-loop`, step 1). It asks in prose and carries on.
5. While references are pending, do the work that does not depend on them: behaviour specs, the data design, spikes.

### 2. Specs and design

1. Edit the specs for behaviour and keep visual detail out of them.
2. Where the work needs design, run the design loop's direction step (`design-loop`, step 2) for each surface the work adds or reshapes. Its refined mockup is the contract the build is compared with every round.

### 3. Design the system, simply

1. **Spike the hardest interaction at target scale first.** That means drag, zoom, scroll or live updates, with realistic volume on a slowed device (in a browser, the CPU throttled 4x). Then choose the architecture that makes it cheap, and record the numbers.
2. **Keep one source of truth** for each piece of state, and one optimistic path. If the design needs a further layer to reconcile two others, the design is wrong.
3. **Keep files reviewable:** no component over about 400 lines.
4. **Have a fresh-eyes agent review the technical design** before anything is built. This is an architecture call: use the strongest model, with none of your context.
5. **Seed edge-case data before the build lands.** Keep a rig seed, in the recipe's `seed` entry point so every lease starts from it, that holds the awkward shapes the design must survive, not only happy data: names that differ by case or collide after normalising, unicode, maximum counts and lengths, records shared between owners, deleted and moved records, legacy rows from before the change, and users at every access level. Walkthroughs, package checks, backend rounds and migration tests all run on it.
6. **Put every settled decision through a security lens** before it goes into a brief.
   - Bound and validate input where it crosses a boundary: dates, lengths, sizes.
   - Fail closed when an access check goes unanswered.

### 4. Build

Build through work packages as the playbook describes, with Sonnet agents running in parallel where they share no files.

- Before a package is done, verify it with the QA loop's lenses scoped to it: its lenses once, its fixes re-checked by a different agent, a test for everything found. This is the QA loop's method, not a run of the QA loop, so it reports no round of its own. Its findings are filed as yours, in the round you are in or, before round 1, with the first.
- A fix that removes a safeguard to save cost, such as a revalidation, a check or a retry, is re-checked before it lands.

### 5. The rounds

Once the first version works, the run alternates. Each feature round is followed by polish rounds and backend rounds until both converge, and then the next feature round starts. Most of the run's time is spent here. Report a round when its feature, polish and backend work are done.

**Feature rounds.** Follow design judgement, "Deciding features".

1. **Walk the jobs.** In the build on the rig, do each job the surface exists for, end to end, with realistic data, by keyboard and by pointer, as each kind of user. Time each job and count its steps. See how the reference handles the same job.
2. **Collect candidates:**
   - places where a job is slow, uncertain or impossible;
   - what the reference does that this does not;
   - the backlog;
   - cuts: elements no walkthrough used, and features that duplicate another.
3. **Judge every candidate** against the criteria and record the decision in the feature ledger: add, change, cut, backlog or out.
4. **Take a small batch, one to three items.** Each goes through the full path:
   - its behaviour spec;
   - its design, through the design loop's direction step where the work needs design;
   - its build;
   - its package check.

   It then enters the polish rounds like everything else, where the work needs design.
5. **Walk the jobs again** and compare with the first walkthrough. Keep a change that made its job faster or more certain. Revert one that did not, and record why.

The bar for adding rises as the run goes on. Early rounds settle the shape; later rounds should mostly change and cut.

**Polish rounds.** These run only where the work needs design, and are the design loop's polish step (`design-loop`, step 3) over the build. Run it until its stop condition holds, then return to a feature round. A feature idea it sets aside goes on the feature ledger's backlog. When its findings have shrunk to the edges, do not let polish rounds crowd out the backend rounds: run them in parallel, or stop polishing.

**Backend rounds.** Exploratory testing of the server side as a whole, in passes, the way polish rounds explore the screens. A package check probes each package's entry points; a backend round explores every entry point the feature touches, on the edge-case seed, and keeps going until the backend stops yielding findings. Run each as `.agents/skills/explore-backend/SKILL.md` says, filing its findings under this run. A backend round is done when that skill's stopping condition holds.

**The run is done** when its stop rule is met on a round whose feature round found nothing to add, change or cut and whose backend round converged, and the design loop's polish after it converged where the work needs design. Running out of time or ideas does not end the run; only the stop rule and the cap do.

### 6. Report

Recap, leading with what was built and where it stands, then:

- screenshots of the main states;
- what you added, changed and cut beyond the ask, with the job each serves;
- the rounds, what each found, and the tests added;
- the backlog and the Out list;
- anything unverified, and what is left for the QA loop, the refactor loop and the review loop.

### Never

- Add a feature without walking the jobs it serves, before and after.
- Take more than three features into one feature round.
- Close a review round whose fixes were never re-reviewed.
- Fix a substantive bug without a test that failed before the fix.
- Keep polishing edges while the backend has not been explored directly.
- Change a shared component without looking at every place it appears.
- Review, fix and re-test, or critique and polish, by your own improvised process when `qa-loop` or `design-loop` covers it.
- Report a round you did not finish, or report `stopped` when the user did not say stop.
- Call `hold_pr` or `release_pr`: the run holds the pull request itself.
- Leave an agent's model unset.
