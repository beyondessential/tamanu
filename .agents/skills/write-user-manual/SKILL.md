---
name: write-user-manual
description: >-
  Write or update the Tamanu user manuals for a module on Desktop or Mobile, grounded in the
  running app and landed as a reviewed pull request. Use when the user wants a page of the user
  manuals written (e.g. "write the user manual for recording vitals"), wants an existing page
  refreshed, or wants to add a module to the manuals. Follows specs/documentation/user-manuals.md.
  Not for configuration guides (see draft-config-guide) or support runbooks (see
  curate-support-docs).
label: "Write user manual"
---

## Your task: Write the user manuals

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
   Use a demo environment the author provides; ask for its address, a login, and the name of the
   test patient to use.

Report anything you couldn't confirm by clicking as unverified.

Tamanu's old user guides are in Slab, which you can't reach. If the author pastes one in, read it to
see what the area used to cover, but write from the app rather than from its wording.

### 3. Capture screenshots

Write every screenshot as a placeholder first. While clicking the flow through on the author's demo
site, capture the shot each placeholder asks for. Save the shots outside the repository and show
them to the author; only the ones they approve go into the module's `images/` folder, replacing
their placeholders.

Frame each shot on the part of the screen its step is about, and capture at double resolution so
text stays sharp when shown smaller. Suggest which shots need a red outline, one for each control a
step asks the reader to select, and let the author confirm. Draw the border and any outline into
the image, since GitHub strips styling from markdown images. Add each image with its caption as the
spec describes; the worked example shows the markup.

Everything in the frame is published, so use only the test patient the author names. If their record
can't show a screen, leave that placeholder rather than using another patient. Get the author's
agreement before creating records for them, and enter plausible data where a screen would otherwise
look empty. Never publish an image that shows a real patient.

If you can't drive a browser, leave the placeholders for a person to fill.

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
