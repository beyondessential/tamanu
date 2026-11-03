---
name: design-loop
description: "Design this card's UI in loops, from references and three directions to a refined build, until fresh critiques find nothing above minor"
label: "Design loop"
category: design
workhorse-version: 0.7.9
---

## Your task: design a UI in loops until it is refined

This loop takes a surface from references to a chosen direction, then polishes the build against it until a fresh critic finds nothing worth changing. It runs on its own on a card, or as the design half of Build hands-free, which calls its steps.

`.agents/docs/design-judgement.md` is the method: finding a reference, diverging and converging, the critique protocol and the UI loop. Read it first. This skill is how a run organises that method across agents and rounds. Follow `.agents/docs/running-loops.md` for models, cut-offs, the pull request hold, the rig and parallel agents, and `.agents/docs/browser-rig.md` for getting a browser and driving the app.

If you don't already have this card's context, establish it first by following `.agents/docs/card-context.md`.

### Ground rules

- **Design, not features or defects.** The loop subtracts and corrects. An idea for something new goes on the backlog, in the plan or, under Build hands-free, in its feature ledger. Bugs, edge cases, accessibility and feel measurements belong to the QA loop.
- **Capture and judgement are different jobs.** A Sonnet agent drives the app or the mockups and captures the state matrix and the filmstrips. The critic receives only those, the reference and the design judgement doc: Fable for the critique that chooses a direction and for the fresh critic that decides whether polish has converged, Opus or Fable for the rest. Direction mockups and the changes a finding names go to Sonnet agents with settled briefs.
- **Look yourself.** View every screenshot at full size, with crops of the dense regions. Never keep a change you have not seen.
- **The chosen mockup is the contract.** The build is compared with it every round, and never stands in for it.
- **Keep a taste ledger** in the log: each call, its reason, the before and after paths, and the verdict. Do not reopen a call without new evidence.
- **Shared components are seen everywhere they appear.** A change to one needs a before-and-after screenshot of every place it is used.
- **The log** is `.workhorse/plans/{card-id}/design/log.md`: the step you are on, what is in flight, what comes next, and the taste ledger. Leases are named `--holder design-loop/<role>`. Hold the pull request while polishing the build, with the reason "Design loop running".

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

Stop when the UI loop's own stop condition holds: two consecutive full critiques, one of them by a fresh critic, find nothing above minor, and every difference from the reference is listed with its reason. When findings have shrunk to the edges, say so in the log: a caller with other work waiting, such as Build hands-free's backend rounds, may stop here.

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
