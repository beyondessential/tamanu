---
name: write-user-guide
description: >-
  Write or update an end user guide for a Tamanu module on Desktop or Mobile, grounded in the
  running app and landed as a reviewed pull request. Use when the user wants a user guide or manual
  page (e.g. "write a guide for recording vitals"), wants an existing guide refreshed, or wants to
  add a module to the manual. Follows specs/documentation/user-manuals.md. Not for configuration
  guides (see draft-config-guide) or support runbooks (see curate-support-docs).
label: "Write user guide"
---

## Your task: Write a user guide

You write the end user manuals in `docs/user-manuals/`: task guides for the staff who use Tamanu.

Read `specs/documentation/user-manuals.md` first. It sets the structure, guide anatomy, language,
numbering, scope and screenshot rules. This file is the procedure; where they differ, the spec wins.

One run covers one module on one platform. `docs/user-manuals/desktop/vitals/record-vitals.md` is the
worked example, and `.workhorse/design/designs/user-manual-guide-page.html` shows it as a reader
meets it.

Writing a new guide and updating an existing one are the same job from different starting points.
When updating, re-verify the guide against the running app, revise what has drifted, remove steps
that no longer exist, and leave the rest alone.

### 1. Settle the scope, and confirm it

The author names the platform and module. Explore that area of the app, propose the guides with a
one-line description each, and get the list approved before writing.

### 2. Ground every step

1. **Read the implementation**: `packages/web` for desktop, `packages/mobile` for mobile. On-screen
   labels are the `fallback` strings on `TranslatedText` and `getTranslation`; copy them exactly.
   A fallback is only a label if the screen displays it: fields in survey-driven forms, such as
   vitals, take their labels from the site's configuration, not from the code.
2. **Read the relevant spec** under `specs/`, but expect it to be thin. Much of the tree is stubs,
   so the code is the source of truth.
3. **Run the app and click the flow through** before publishing, to confirm what each action does.
   Use a demo environment the author provides; ask for its address and a login.

Report anything you couldn't confirm by clicking as unverified.

The Slab guides are being retired. Use them to see what an area covered, but write from the app, not
from Slab's wording.

### 3. Leave screenshot placeholders

Write every screenshot as a placeholder. There's no capture tooling, so a person takes the shots
and replaces the placeholders.

Whoever takes them should use an environment where the shots can be published, and enter plausible
data first where a screen would otherwise look empty. Check every image before committing: never
publish one that shows a real patient.

### 4. Update the navigation

Don't hand-edit index pages, numbers, back-links or previous/next links. Add the module or guide to
`docs/user-manuals/manifest.json`, then run `npm run build-user-manuals` and
`npm run check-user-manuals`.

### 5. Check the GitHub render

Readers see these files as GitHub renders them, so preview each guide rather than trusting the
source. A single newline inside a paragraph collapses to a space. Confirm that:

- each step's detail stays indented under its step
- on-screen labels are bold
- the back-link sits above the title, and previous/next links sit below the final rule
- each screenshot placeholder is on its own line

### 6. Land it

Open a reviewed pull request following `llm/project-rules/pull-requests.md` and
`llm/project-rules/git-workflow.md`. Tamanu doesn't allow the `docs` type; use `chore`. In the
description, list the guides changed, anything left unverified, and the screenshot placeholders
still to be filled.
