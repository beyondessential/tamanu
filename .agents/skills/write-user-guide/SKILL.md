---
name: write-user-guide
description: >-
  Write or update an end user guide for Tamanu, grounded in the running app and landed as a reviewed
  pull request. Use when the user wants a user manual or user guide for a Tamanu module on Desktop or
  Mobile (e.g. "write a guide for recording vitals"), wants an existing guide refreshed against the
  current app, or wants to add a module to the manual. Writes to docs/user-manuals/ following
  specs/documentation/user-manuals.md, and maintains the navigation through the manifest and its
  generator. Not for configuration guides aimed at project managers (see
  llm/project-rules/write-config-guides.md), nor for support runbooks (see curate-support-docs).
label: "Write user guide"
---

## Your task: Write a user guide

You write the end user manuals that live in `docs/user-manuals/` — task guides for the clinical and
administrative staff who use Tamanu, not for the people who configure or build it.

**Read `specs/documentation/user-manuals.md` first.** It specifies the structure, the anatomy of a
guide, the language rules, numbering, and how screenshots are handled. This file is the procedure;
that spec is the standard, and it wins wherever the two seem to differ.

One run covers **one module on one platform**. Desktop and mobile guides stand alone and are never
written as variants of each other — the two apps genuinely differ, and mobile lacks whole areas that
desktop has.

### Settle the scope before writing

The person running you names the platform and the module. You work out the tasks: explore that area
of the app, propose the list of guides with a one-line description each, and get it approved before
writing any of them. Don't guess the task list and don't write the whole module in one silent go.

A guide covers a single user action. Where a module's actions are small and tightly related, group
them rather than fragmenting into near-empty files.

### Ground every step in the running app

Work in this order, and don't skip ahead:

1. **Read the implementation.** Desktop is `packages/web`, mobile is `packages/mobile`. The
   on-screen labels are the `fallback` strings on `TranslatedText` / `getTranslation` — take them
   verbatim, including punctuation, because the guide names things exactly as the reader sees them.
2. **Read the relevant spec under `specs/`** for intended behaviour. Treat it as thin: much of
   Tamanu's spec tree is a stub, so the code is the real source. Never assume a spec exists or is
   complete.
3. **Run the app and click the flow through** before the guide is published. This is where claims
   about what happens after an action get confirmed, and it is also when you capture screenshots.

Anything you could not confirm by clicking is a claim, not a fact. Say so when you hand the work
back rather than letting an unverified step read as settled.

### Stay on mechanics, not configuration

Guides describe how the product works, which holds at every deployment. How a site has been set up
does not belong in them.

Much of Tamanu's UI is survey-driven or reference-data-driven, so its fields vary per site. Cover
finding the form, selecting it, completing it, and submitting it, and leave its fields alone. Where
an action depends on a site's setup, say so, and tell the reader to contact their system
administrator if they cannot do something they expect to.

### Screenshots

Write the guide with placeholders first, then fill the ones you can. A placeholder is a real
deliverable, not a failure — it records a shot the guide needs, and it is far better than a wrong or
stale picture.

**Desktop.** `scripts/capture-user-manual-screenshot.mjs` takes one shot per run against whatever
Tamanu you point it at. It reads `FACILITY_FRONTEND_URL`, `TEST_EMAIL`, and `TEST_PASSWORD` from
`packages/e2e-tests/.env` when that file exists, so a machine already set up for Playwright tests
needs nothing further; exporting any of them in the shell overrides the file. Browsers come from
`npx playwright install chromium`. Read the script's header for its options.

```
node scripts/capture-user-manual-screenshot.mjs \
  --path /patients/all \
  --out docs/user-manuals/desktop/patients/images/find-a-patient-list.png
```

Getting a Tamanu running is the hard part, not the capture. Pointing at an existing deployment via
`FACILITY_FRONTEND_URL` avoids standing up the local stack, which needs two databases, a
provisioning run, and a sync bootstrap (`packages/e2e-tests/README.md`). **Ask which environment to
use rather than assuming** — it determines whether the shots are publishable.

**Mobile.** There is no capture tooling and no emulator automation. Mobile screenshots are taken by
a person. Leave placeholders and say so when you hand the work back.

**Expect to set the screen up first.** Demonstration data is thin, so a screen often photographs
empty: a chart with no readings, a patient with no encounter, an empty worklist. Entering what the
shot needs is part of capturing it. Put in enough to make the screen read the way a user's would,
and keep what you enter plausible — a guide illustrated with nonsense values teaches the reader to
distrust it.

**Two rules that do not bend:**

- **Never capture a screen showing real patient information.** These images are published. Shoot
  against demonstration or test data, and look at what you captured before committing it. Seed
  patients like `Test Patient` are fine; anything from a live deployment is not.
- **Replace the placeholder with the image, never leave both.** Put the file in the module's
  `images/` folder, name it for its guide and what it shows, and give it alt text describing the
  screen. `npm run check-user-manuals` reports a missing image or empty alt text.

If a screen will not hold still, looks empty because the data is thin, or needs a state you cannot
reach, leave the placeholder and say which shots are outstanding.

### Never hand-edit the navigation

Index pages, module and guide numbers, back-links, and the links between neighbouring guides are all
**generated**. Editing them by hand desynchronises them from the manifest and the next build reverts
your edit.

1. Edit `docs/user-manuals/manifest.json` — add the module or list the new guide in the order a
   reader would work through it.
2. Run `npm run build-user-manuals`.
3. Run `npm run check-user-manuals` to confirm nothing drifted and no guide file is unlisted.

Write only the guide's own prose. Moving something in the manifest renumbers everything after it and
repairs the affected links, so reordering is a manifest edit rather than a sweep through the files.

### Confirm how it renders on GitHub

The manuals live in the repository, so GitHub's markdown rendering is where readers actually meet
them. Source that looks right can still render wrongly, and the failure is silent — so preview the
file as GitHub renders it before handing the work back, rather than trusting the source.

The trap to know: **a single newline inside a paragraph renders as a space.** Anything you intend as
two separate blocks needs a blank line between them, or the two collapse into one run of text and the
structure you wrote disappears.

Confirm each of these survived the render:

- Each numbered step keeps its supporting detail as an indented paragraph under that step, rather
  than flattening into the step text or breaking the numbering.
- On-screen labels are still bold, so a reader can match the words to what is in front of them.
- The link back to the module index sits above the title, and the previous/next links sit below the
  rule at the end.
- Each screenshot placeholder stands on its own line where the guide needs the shot.

`.workhorse/design/designs/user-manual-guide-page.html` is the worked example of a guide as a reader
meets it, if you need to compare against something concrete.

### Updating an existing guide

Same skill, same grounding. Re-verify the guide against the running app, revise what has drifted, and
leave what is still true alone. A refresh is not a rewrite. If the product changed enough that a step
no longer exists, remove it rather than leaving a step that fails for the reader.

### Slab is reference, not a source

Tamanu's existing user guides on Slab are being retired. Read them to see what an area used to cover
and to spot tasks worth including, but author the content from the app — Slab's wording may describe
a version of the product that has moved on.

### Landing the change

Guides land as a **reviewed pull request**, never a silent commit. Follow
`llm/project-rules/pull-requests.md` for the template and
`llm/project-rules/git-workflow.md` for the title format. Note that **Tamanu does not allow the
`docs` conventional type** — use `chore` for documentation changes.

In the PR, say which guides were added or changed, and call out anything you could not verify against
a running app so the reviewer knows what to check.
