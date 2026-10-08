---
name: draft-user-guide
description: >-
  Draft or update an end user guide for a Tamanu module on Desktop or Mobile. Use when the user wants a
  user guide written or refreshed (e.g. "write a user guide for recording vitals"), or wants a module
  added to the user guides. Grounds every step in the running app, and commits the guide under
  docs/user-manuals/ for the author to review and raise as a pull request. Not for configuration guides
  (see draft-config-guide) or support runbooks (see curate-support-docs).
label: "Draft user guide"
---

## Your task: Draft a user guide

You write the end user guides in `docs/user-manuals/`: task guides for the staff who use Tamanu. You
ground every step **in the running app**, so the guide matches what the reader will see, and commit
the guides for the author to review.

Read `.agents/docs/user-guide-format.md` first and follow it for anything about what a guide looks
like: location, numbering, structure, language, screenshots and accuracy. This file is the procedure
only.

One run covers one module on one platform. `docs/user-manuals/desktop/10-vitals/1-record-vitals.md` is
the worked example, and `.workhorse/design/designs/user-guide-page.html` shows it as a reader meets it.

Drafting a new guide and updating an existing one are the same job from different starting points.
When updating, re-verify the guide against the running app, revise what has drifted, remove steps that
no longer exist, and leave the rest alone.

### 1. Settle the scope, and confirm it

The author names the platform and module. Explore that area of the app and propose the guides, each
with a one-line description. If the module has no folder yet, propose where it sits in the module
order, since adding it renumbers the modules after it.

In the same review, ask for a demo site, a login, the test patient to use, and the go-ahead to record
data against that patient where a guide's action writes it. Get the list approved before writing.

### 2. Ground every step

1. **Read the implementation**: `packages/web` for desktop, `packages/mobile` for mobile. On-screen
   labels are the `fallback` strings on `TranslatedText` and `getTranslation`; copy them exactly.
   A fallback is only a label if the screen displays it: fields in survey-driven forms, such as
   vitals, take their labels from the site's configuration, not from the code.
2. **Read the relevant spec** under `specs/`, but expect it to be thin. Much of the tree is stubs,
   so the code is the source of truth.
3. **Run the app and click the flow through** on the author's demo site before publishing, to
   confirm what each action does.

Report anything you couldn't confirm by clicking as unverified.

Driving a demo site:

- **Confirm first** that it holds synthetic data only, since the screenshots are published, and that
  it runs the version the guide documents
- **Keep the login to the session.** Never write it to a file, commit it, or put it in the PR. If a
  login fails, stop and check rather than retrying, since repeated failures can lock a shared account
- **Use only the test patient the author names.** Where their records can't show a screen, say so
  rather than using another patient
- **Guides document actions that write data**, so recording against the test patient is expected
  once the author has agreed. Keep it to what the guide needs, and enter plausible values
- **Drive it with a throwaway script outside the repository**, not a spec in the e2e suite

Tamanu's old user guides are in Slab, at
https://beyond-essential.slab.com/public/topics/user-manuals-up14zqup, which you can't reach. Don't go
looking for them: if the author pastes one in, read it to see what the area used to cover, but write
from the app rather than from its wording.

### 3. Screenshots

Leave a placeholder for each image the guide needs, per the format doc. While clicking the flow
through, capture the shot each placeholder asks for, per the format doc. Save the shots outside the
repository and show them to the author **together with the red outlines you propose, as one review**.
Only approved shots go into the module's `images/` folder, replacing their placeholders.

If you can't drive a browser, leave the placeholders for a person to fill.

### 4. Land it

Write the guides, update the module README and the platform README, check every link still resolves,
and commit. Do not open the pull request: the author reviews the diff and raises it. Title it to
Tamanu's conventional commit format (`llm/project-rules/pull-requests.md`; `docs` is not an allowed
type, use `chore`).

Then tell the author what you wrote, anything you couldn't verify, and any screenshot placeholders
still to be filled and why, so they can go in the pull request description.
