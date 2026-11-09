---
name: design-loop
description: "Design this card's UI in loops, from references and three directions to a refined build, until fresh critiques find nothing above minor"
label: "Design loop"
category: design
workhorse-version: 0.7.14
---

## Your task: design a UI in loops until it is refined

This loop takes a surface from references to a chosen direction, then polishes the build against it until a fresh critic finds nothing worth changing. It is one of the card's loops: it runs on its own on a card, as the first loop Hands-free mode queues, and as the design half of the build loop, which calls its steps.

`.agents/docs/design-judgement.md` is the method: finding a reference, diverging and converging, the critique protocol and the UI loop. Read it first. This skill is how a run organises that method across agents and rounds. Follow `.agents/docs/running-loops.md` for models, cut-offs, how a round is reported, what this card's rigour sets, the rig and parallel agents, and `.agents/docs/browser-rig.md` for getting a browser and driving the app.

If you don't already have this card's context, establish it first by following `.agents/docs/card-context.md`.

### Ground rules

- **Design, not features or defects.** The loop subtracts and corrects. An idea for something new goes on the backlog, in the plan or, under the build loop, in its feature ledger. Bugs, edge cases, accessibility and feel measurements belong to the QA loop.
- **Capture and judgement are different jobs.** A Sonnet agent drives the app or the mockups and captures the state matrix and the filmstrips. The critic receives only those, the reference and the design judgement doc: Fable for the critique that chooses a direction and for the fresh critic that decides whether polish has converged, Opus or Fable for the rest. Direction mockups and the changes a finding names go to Sonnet agents with settled briefs.
- **Look yourself.** View every screenshot at full size, with crops of the dense regions. Never keep a change you have not seen.
- **The chosen mockup is the contract.** The build is compared with it every round, and never stands in for it.
- **Keep a taste ledger** in the log: each call, its reason, the before and after paths, and the verdict. Do not reopen a call without new evidence.
- **Shared components are seen everywhere they appear.** A change to one needs a before-and-after screenshot of every place it is used.
- **The log** is `.workhorse/plans/{card-id}/design/log.md`: the step you are on, what is in flight, what comes next, and the taste ledger. Leases are named `--holder design-loop/<role>`. The run holds the pull request itself, so you never call `hold_pr` or `release_pr`.

### Reporting the run

- **File each confirmed defect with `file_issue` as you confirm it,** with a `severity` on the scale the hosted review uses: a major finding is `critical`, a moderate one is `suggestion`, a minor one is `nit`. It is filed under this run and the round you are in, and left open for the QA loop or the agent to fix, since polish rounds only subtract and correct. A change a critique names that you make yourself is a finding too: file it, then set its disposition with `set_issue_disposition` as you make it (in progress, then fixed with the commit's sha, or skipped with the reason). Taste calls, measurements and the taste ledger stay in the log and are not filed.
- **When a round files five or more issues, call `set_triage` before acting on any of them:** the triage rule applies to a loop's issues as it does to any others.
- **Call `report_round` once per round** (a round is one full critique of the build against the reference and the chosen mockup, with the changes it led to): `loop` `design_loop`, the `round` you have just finished counting from 1, the `cap` this card's rigour gives (the turn names it), `found` as the round's critical, suggestion and nit counts from the critique, a one-line `summary`, and `status`: `going` while another round follows, `done` when the stop rule in step 3 is met, and `stopped` only if the user told you to stop. If the tool refuses because the conversation has no open run of the loop, say so and do not report again.

### 0. Whether the card needs design

Begin here, before anything else, with the prerequisite checks in `.agents/docs/running-loops.md`. Beyond whether the card needs design, ask first when the card does not say what the UI is for. Work that adds a surface, changes a layout, or adds controls or states that no pattern in the app already covers needs design. Backend or data work behind surfaces that already look right, and UI that follows a pattern the app already has, does not. Record the call and its reason in the plan.

If the card needs no design, call `report_round` with `loop` `design_loop`, `status` `done`, `round` 1, the `cap` the turn names, `found` all zero and a one-line `summary` that begins "Needs no design" and gives the reason, then finish with a short note: do no more work, so the loops queued behind this one start without waiting. The judgement is the same whether this loop was started alone or queued by Hands-free mode.

### 1. References

1. Ask whether a product does this well, in prose, then carry on working: the user may already have gone, and a question panel would park the run. Name the screens and states you would capture, each with the decision it settles, and explain how to capture them. If the answer is Linear and a `match-linear` skill is present, follow it from here.
2. Screenshot the app's own best neighbouring surfaces from the rig. They are the reference for consistency, and the only reference if no product one comes.
3. Do not commit to a visual direction without a reference unless the user has said there is none. Do the work that does not depend on one while you wait.

### 2. Direction: diverge, then converge

Run this for a surface that has no chosen direction yet, and again for a part of the build that feels wrong.

1. Brief three agents separately for three structurally different directions, as design judgement's "Diverge, then converge" describes, at real size with real data and the hard cases. Start from a capture or snapshot wherever one covers the screen. A change that neither adds a surface nor changes a layout needs one mockup from the current screen instead.
2. Critique them side by side with the protocol, with a fresh critic. Choose one, and record in the taste ledger why it won and what to take from the others.
3. Refine the chosen mockup through a few iterations of the UI loop before any of it is built.

### 3. Polish the build

Once there is a build, run design judgement's "The UI loop" over the full state matrix and the interaction filmstrips: shoot, critique, change one thing, compare before and after, log it. Each round, compare against the reference and against the chosen mockup.

Stop when the card's rigour's stop rule holds (`.agents/docs/running-loops.md`): the clean critiques in a row it asks for, the last of them by a fresh critic, where a critique is clean by severity as the table says (at thorough, nothing above minor, the UI loop's own condition), and every difference from the reference is listed with its reason. When findings have shrunk to the edges, say so in the log: a caller with other work waiting, such as the build loop's backend rounds, may stop here.

### 4. Report

Lead with where the design stands, then:

- screenshots of the main states beside the reference and the chosen mockup;
- the taste ledger's main calls;
- the differences from the reference that remain, each with its reason;
- the backlog of feature ideas the loop set aside;
- anything unverified.

### Never

- Design from memory when a capture is possible.
- Treat the build as the mockup.
- Add, change or cut a feature in a polish round.
- Polish one direction without first trying three, where the surface is new or its layout changes.
- Have the critic drive the app to make its own captures.
- Call `hold_pr` or `release_pr`, or report a round you did not finish.
