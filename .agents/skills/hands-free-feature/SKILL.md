---
name: hands-free-feature
description: "Design, build and polish a large feature end to end without check-ins, until it is beautiful, refined and free of bugs"
label: "Build hands-free"
category: build
workhorse-version: 0.7.9
---

## Your task: build a large feature, hands free

The user asks once and comes back later. What they come back to has to be beautiful, refined, a pleasure to use and free of bugs, with nothing left to fix before it merges. You decide what the feature should do as well as how it looks: add what the user's work needs, change what is not working, and cut what does not earn its place. You have hours. Spend most of them using the result and making it better.

Read these before anything else:

- `.agents/docs/design-judgement.md`: deciding features and the bar for taste. Feature rounds follow its "Deciding features".
- `.agents/docs/flagship-surface-playbook.md`: the method in detail, covering work packages, the polish loop, backend exploration loops and parallel agents.
- `.agents/skills/qa-loop/SKILL.md`: how verification runs. This skill decides what to build and how it should look; every check that it works is the QA loop's job, and you follow it rather than inventing reviews of your own. It takes the model table, the browser rig and the stopping rule from there.
- `.agents/docs/running-loops.md`: the rules every loop of agents follows.
- `.agents/docs/browser-rig.md`: how to get a browser and drive the app.
- `.agents/skills/design-loop/SKILL.md`: the design loop this run calls for references, directions and polish rounds, where the work needs design.
- `.agents/skills/refactor-loop/SKILL.md`: the refactor loop this run calls (see "Refactor rounds" below).

If you don't already have this card's context, establish it first by following `.agents/docs/card-context.md`.

### Ground rules for the whole run

- **Two kinds of round, never mixed.** A feature round decides what the product does: it adds, changes and cuts features. A polish round makes what exists right: it subtracts and corrects, and never adds. Both loop just as hard. Mixing them is how runs go wrong: features slip in alongside fixes, and none of them gets its own design, review or polish.
- **Keep a feature ledger** in the plan:
  - **Asked:** the user's own ask. Fixed. You may refine how it works, never drop it.
  - **In:** what you decided to build, each item with the job it serves and the evidence for it.
  - **Changed and cut:** what you reshaped or removed, and why.
  - **Backlog:** candidates for the next feature round.
  - **Out:** what you decided against, with the reason. Anything the user ruled out is fixed here.

  You move items between these lists, but only in a feature round, and every move is recorded with its reason so the user can overrule it later.
- **Fence the shared components.** List in the plan the shared components you expect to change. Changing any other one needs a reason in the plan and a before-and-after screenshot of every place it appears.
- **Follow `.agents/docs/running-loops.md`** for models, cut-offs, the pull request hold, the rig and parallel agents. For this run: Sonnet builds the work packages, and planning, the hardest spike and the technical design review go to you or a stronger agent. Leases are named `--holder hands-free/<role>`. The loop log is `.workhorse/plans/{card-id}/loop.md`, beside the QA loop's and the design loop's own.
- **Test the backend as hard as the screens.** A feature's server side (its actions, routes, access checks, data model, migrations and background work) gets its own exploratory loops, run against the rig with seeded edge-case data, not only the QA loop's per-batch lenses and the walkthroughs that reach it through the UI. Give it comparable time: once polish findings are only at the edges (a tap target, a hyphen), stop polishing and spend the time on the backend.
- **Every substantive finding becomes an automated test,** wherever it was found: in the QA loop, a backend round, a walkthrough or a critique. The QA loop's rule applies to all of them: a test at the lowest level that would have caught it, failing before the fix and passing after, committed with the fix. A fix without one is not finished.
- **Write less code.** Every round adds code, and agents keep adding rather than stepping back. Before writing a component, hook or helper, look for one the codebase already has. Track the branch's line count in the plan as the run goes, and run refactor rounds to bring it down. On a large feature, ending with around half the code it first needed is a reasonable ambition, though the judgement of what reads simplest wins over the number.
- **Ask once, at the start, without stopping.** The only question you ask is for references (step 1), when the work needs design, together with anything that truly blocks. After that, decide, and record each decision and its reason in the plan, where the user can overrule it later.

### 1. Brief, references and scope

1. Write the brief into the plan, using the template at the top of the playbook.
2. List the jobs the surface exists for, three to six of them, each naming who does it, when, and what done looks like. Feature rounds walk these jobs, so make them concrete: "a lead moves a slipping project two weeks later and sees what else now overlaps", not "manage projects".
3. **Decide whether the work needs design.** It does when it adds a surface, changes a layout, or adds controls or states that no pattern in the app already covers. It does not when it is backend or data work behind surfaces that already look right, or when its UI follows a pattern the app already has. Record the call and its reason in the plan. Without design, skip the design loop: new UI follows the neighbouring surfaces, and the QA loop still checks it for bugs and roughness. A feature batch that adds a surface or changes a layout brings design back for that batch.
4. Where the work needs design, start the design loop's references step now (`design-loop`, step 1). It asks in prose and carries on.
5. While references are pending, do the work that does not depend on them: behaviour specs, the data design, spikes.

### 2. Specs and design

1. Edit the specs for behaviour and keep visual detail out of them.
2. Where the work needs design, run the design loop's direction step (`design-loop`, step 2) for each surface the work adds or reshapes. Its refined mockup is the contract the build is compared with every round.

### 3. Design the system, simply

1. **Spike the hardest interaction at target scale first.** That means drag, zoom, scroll or live updates, with realistic volume and the CPU throttled 4x. Then choose the architecture that makes it cheap, and record the numbers.
2. **Keep one source of truth** for each piece of state, and one optimistic path. If the design needs a further layer to reconcile two others, the design is wrong.
3. **Keep files reviewable:** no component over about 400 lines.
4. **Have a fresh-eyes agent review the technical design** before anything is built. This is an architecture call: use a Fable agent, with none of your context.
5. **Seed edge-case data before the build lands.** Keep a rig seed, in the recipe's `seed` entry point so every lease starts from it, that holds the awkward shapes the design must survive, not only happy data: names that differ by case or collide after normalising, unicode, maximum counts and lengths, records shared between owners, deleted and moved records, legacy rows from before the change, and users at every access level. Walkthroughs, the QA loop, backend rounds and migration tests all run on it.
6. **Put every settled decision through a security lens** before it goes into a brief.
   - Bound and validate input where it crosses a boundary: dates, lengths, sizes.
   - Fail closed when an access check goes unanswered.

### 4. Build

Build through work packages as the playbook describes, with Sonnet agents running in parallel where they share no files.

- After each package, run the QA loop scoped to it, following `qa-loop`: its lenses once, its fixes re-checked by a different agent, a test for everything it finds. A package is not done until that closes.
- A fix that removes a safeguard to save cost, such as a revalidation, a check or a retry, is re-checked before it lands.

### 5. The rounds

Once the first version works, the run alternates. Each feature round is followed by polish rounds and backend rounds until both converge, and then the next feature round starts. Refactor rounds come after the first version works and again before landing. Most of the run's time is spent here.

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
   - the QA loop, scoped to it.

   It then enters the polish rounds like everything else, where the work needs design.
5. **Walk the jobs again** and compare with the first walkthrough. Keep a change that made its job faster or more certain. Revert one that did not, and record why.

The bar for adding rises as the run goes on. Early rounds settle the shape; later rounds should mostly change and cut.

**Polish rounds.** These run only where the work needs design, and are the design loop's polish step (`design-loop`, step 3) over the build. Run it until its stop condition holds, then return to a feature round. A feature idea it sets aside goes on the feature ledger's backlog. When its findings have shrunk to the edges, do not let polish rounds crowd out the backend rounds: run them in parallel, or stop polishing.

**Backend rounds.** Exploratory testing of the server side as a whole, in loops, the way polish rounds explore the screens. The QA loop probes each batch's endpoints; a backend round explores every entry point the feature touches, on the edge-case seed, and keeps going until the backend stops yielding findings. The playbook's "Backend exploration loops" has the method. Each round:

1. **Explore** against the rig and the functions behind it:
   - **Every entry point directly,** not only through the UI: API routes and server actions over HTTP as each kind of user, and the plain functions behind them called from a harness.
   - **The access matrix:** every entry point for each access level (member, member who lost access, check unanswered, non-member, signed out), and with ids belonging to another owner.
   - **Hostile input:** malformed, oversized, unicode, case variants, path tricks, and values from another tenant.
   - **Concurrency:** the same write twice at once, conflicting writes, a write racing a delete, retries after a lost response.
   - **Failure injection:** the external service down, slow or answering errors; a partial write; a restart mid-operation.
   - **Data at scale and in odd shapes:** large counts, legacy rows, records shared between owners, and the migration run on hostile data.
2. **Write each substantive finding up** in the QA loop's finding shape, with a reproduction, then turn it into a failing unit or integration test.
3. **Fix** in a package whose decisions are settled, and have a different agent re-check the fix, as the QA loop does.
4. **Explore again,** including around what the fixes touched.

Stop when a full exploratory pass finds nothing above low and every substantive finding from earlier passes has its test.

**Refactor rounds.** Follow the refactor loop skill (`.agents/skills/refactor-loop/SKILL.md`) over everything the branch changed: measure, survey with fresh eyes, triage into a ledger, refactor in packages, prove behaviour unchanged, and loop until two fresh surveys find nothing worth doing.

- Run one once the first version works, before the rounds pile more code onto its structure, and one before landing, after the last feature, polish and backend rounds and before the final QA loop.
- Prove behaviour unchanged with what the run already has: the full suite, the rig's screenshot matrix compared before and after, and the backend rounds' probes.
- Refactor rounds never change behaviour. A bug they find goes to the QA loop or a backend round, with its failing test.

**The QA loop runs with every batch, and to the end.** After each feature batch and each run of polish rounds, run `qa-loop` over what changed. Before landing, run it over the whole branch and carry it to its own stopping rule, two consecutive clean rounds with the second cold. It also owns the tests: whatever it finds that the tests did not cover is committed with its fix.

**The run is done** when all of these hold:

- a full feature round finds nothing to add, change or cut;
- the design loop's polish after it converges, where the work needs design;
- the backend loop converges: a full exploratory pass finds nothing above low, and every substantive finding has an automated test;
- the refactor loop before landing converges;
- the final QA loop met its stopping rule on the code as it will land, and nothing was changed after it.

Running out of time or ideas does not end the run; only these conditions do.

### 6. Land and report

1. Merge main, then checkpoint: typecheck, lint, the full suite against a database, and the build. If the merge changed anything of substance, run the QA loop again over the merge.
2. Push, and get CI green.
3. Keep the PR description, the test cases and the progress summary current.
4. Recap, leading with what was built and where it stands, then:
   - screenshots of the main states;
   - the code's size, before and after the refactor rounds;
   - what you added, changed and cut beyond the ask, with the job each serves;
   - the taste ledger's main calls;
   - the QA loop's result, in its own words: rounds, findings, tests added, and what it could not verify;
   - the backlog and the Out list;
   - anything unverified.

### Never

- Add a feature without walking the jobs it serves, before and after.
- Take more than three features into one feature round.
- Close a review round whose fixes were never re-reviewed.
- Fix a substantive bug without a test that failed before the fix.
- Keep polishing edges while the backend has not been explored directly.
- Land without a refactor round after the last feature.
- Change a shared component without looking at every place it appears.
- Review, fix and re-test, or critique and polish, by your own improvised process when `qa-loop` or `design-loop` covers it.
- Leave an agent's model unset.
