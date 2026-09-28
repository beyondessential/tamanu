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

One run covers one module on one platform.

### Settle the scope

The author names the platform and module. Explore that area of the app, propose the guides with a
one-line description each, and get the list approved before writing.

### Ground every step

1. **Read the implementation**: `packages/web` for desktop, `packages/mobile` for mobile. On-screen
   labels are the `fallback` strings on `TranslatedText` and `getTranslation`; copy them exactly.
2. **Read the relevant spec** under `specs/`, but expect it to be thin. Much of the tree is stubs,
   so the code is the source of truth.
3. **Run the app and click the flow through** before publishing. This confirms what each action
   does, and it's when you capture screenshots.

Report anything you couldn't confirm by clicking as unverified.

### Screenshots

Write placeholders first, then fill the ones you can. A placeholder is better than a wrong or stale
image.

**Desktop:** `scripts/capture-user-manual-screenshot.mjs` takes one shot per run. It reads
`FACILITY_FRONTEND_URL`, `TEST_EMAIL` and `TEST_PASSWORD` from `packages/e2e-tests/.env`, with
shell variables taking precedence. Install browsers with `npx playwright install chromium`; options
are in the script header.

```
node scripts/capture-user-manual-screenshot.mjs \
  --path /patients/all \
  --out docs/user-manuals/desktop/patients/images/find-a-patient-list.png
```

The hard part is having a Tamanu to point at. Ask which environment to use, since that decides
whether the shots can be published. Standing up a local stack is covered in
`packages/e2e-tests/README.md`.

**Mobile:** there's no capture tooling. Leave placeholders and say a person needs to take them.

Demonstration data is thin, so enter plausible data first where a screen would otherwise photograph
empty. Check every image before committing: never publish one that shows a real patient.

If you can't get a shot, leave its placeholder and list it as outstanding.

### Navigation is generated

Don't hand-edit index pages, numbers, back-links or previous/next links. Add the module or guide to
`docs/user-manuals/manifest.json`, then run `npm run build-user-manuals` and
`npm run check-user-manuals`.

### Check the GitHub render

Readers see these files as GitHub renders them, so preview each guide rather than trusting the
source. A single newline inside a paragraph collapses to a space. Confirm that:

- each step's detail stays indented under its step
- on-screen labels are bold
- the back-link sits above the title, and previous/next links sit below the final rule
- each screenshot placeholder is on its own line

For a worked example, see `.workhorse/design/designs/user-manual-guide-page.html`.

### Updating a guide

Re-verify it against the running app. Revise what has drifted, remove steps that no longer exist,
and leave the rest alone.

### Slab

The Slab guides are being retired. Use them to see what an area covered, but write from the app,
not from Slab's wording.

### Landing the change

Open a reviewed pull request following `llm/project-rules/pull-requests.md` and
`llm/project-rules/git-workflow.md`. Tamanu doesn't allow the `docs` type; use `chore`. In the
description, list the guides changed and anything left unverified.
