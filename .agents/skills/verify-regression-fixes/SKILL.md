---
name: verify-regression-fixes
description: "Manually verify merged bug fixes against a live release-candidate deployment using a headless browser, and produce a pass/fail matrix. Use when someone wants to QA-verify the regression issues for a Tamanu release — e.g. 'test the merged regression issues', 'verify the fixes on the RC', 'which fixes are actually working on release-2.xx'. Scopes to issues that are merged but not yet QA-ticked in the regression Slack channel. Not for writing automated test suites (see automate-test-cases) or diagnosing a single bug (see investigate-and-fix)."
label: "Verify regression fixes"
workhorse-version: 0.3.0
---

## Your task: Verify regression fixes on the RC

QA raises regression issues in the regression-testing Slack channel each release. Developers merge fixes. This skill closes the loop: for each merged-but-not-yet-verified issue, drive the **live release-candidate** app with a headless browser, reproduce the issue's steps, and record whether the fix actually works in the deployed build. You produce a **matrix**, not prose.

Work code-grounded and evidence-grounded: a verdict is only PASS if a screenshot shows it. Never claim a pass you didn't see.

### 1. Establish the scope — merged AND not-ticked

The set to test is: **issues whose fix is merged to the release branch, that QA has not already verified.**

- Read the regression Slack channel for this release. Each numbered "Issue N" post carries reaction signals:
  - `:caught:` — triaged/acknowledged by the release dev
  - `:merged:` — a fix was merged
  - `:white_check_mark:` — **QA verified it** → already done, **skip**
  A single post sometimes covers two issue numbers; its reactions apply to the shared message.
- For each not-ticked issue, confirm the fix is **actually merged to the release branch** (`release/X.YY`), not just to `main` and not a *closed* PR. `gh pr view <n>` / `git log origin/release/X.YY --grep`. A `:merged:` reaction can be wrong — a PR may have been closed, or merged only to `main` (which means it is NOT in the RC build). Flag those: "merged to main only" / "PR closed, not merged".
- The channel reads are large; if a tool result is truncated to a file, slice it — don't miss issues. Consider delegating the enumeration to a subagent so the raw dump stays out of your context.

### 2. Pick the environment and confirm the build

- RC deploys are at `central.release-X-YY-rc.cd.tamanu.app` and `facility-1.release-X-YY-rc.cd.tamanu.app` (note the `-rc`). Confirm reachability (`curl -s -o /dev/null -w '%{http_code}'`): a healthy host returns `200` on `/` and a real `4xx` (not `000`/`503`) on `/api`. `000` on both = environment down/mid-deploy; `root=200` but `/api=503` = frontend up, API down.
- After logging in, confirm the version shown in-app matches the release. Some fixes merged late may not be in the cut build — the test will reveal it, but note it.

### 3. The headless harness (the hard-won recipe)

A ready-to-run harness ships beside this skill at **`harness.cjs`** — it encapsulates everything below (launch, the UA gate, login, `storageState` reuse, a screenshot helper, and auto-detecting the current Chrome major). It's `.cjs` on purpose: the repo is `"type": "module"`, so a `.js` here would be ESM and couldn't `require`. Use it rather than re-deriving:

```
export PATH="$HOME/.nvm/versions/node/<version-from-.node-version>/bin:$PATH"
export NODE_PATH="<tamanu-repo>/node_modules"          # so require('playwright') resolves
export QA_OUT=/tmp/qa-<release>-facility                # where auth + screenshots land (one per app)
# log in once per app:
node .agents/skills/verify-regression-fixes/harness.cjs login \
  --base=https://facility-1.release-X-YY-rc.cd.tamanu.app --email=admin@tamanu.io --password=admin
```

Then each per-issue script is tiny (keep it OUTSIDE the repo, e.g. in `$QA_OUT`, so it's treated as CommonJS):

```js
const { openAuthed, shot } = require('<repo>/.agents/skills/verify-regression-fixes/harness.cjs');
(async () => {
  const { browser, page } = await openAuthed('https://facility-1.release-X-YY-rc.cd.tamanu.app');
  await page.goto('https://facility-1.release-X-YY-rc.cd.tamanu.app/lab-requests/all', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await shot(page, 't36-active');   // READ the png to judge
  await browser.close();
})();
```

The rest of this section is *why* the harness does what it does (and what to change if it ever stops working). Judge results by **reading screenshots** — MUI dropdown/option text is unreliable via selectors; screenshot and look.

- Env for every run: `export PATH="$HOME/.nvm/versions/node/v26.3.1/bin:$PATH"` (node must match `.node-version`), `export NODE_PATH=<repo>/node_modules` (so `require('playwright')` resolves), cwd = repo root. Playwright + a chromium build already ship in the repo's `node_modules`/cache.
- **CRITICAL — the browser-support gate.** Tamanu blocks unrecognised/old browsers with "Tamanu is not available on your browser". Headless Chromium's UA (`HeadlessChrome`) and any Chrome major more than a few versions behind current are **rejected by the server**. You MUST set the context `userAgent` to a *current* desktop Chrome, e.g. `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/<CURRENT_MAJOR>.0.0.0 Safari/537.36`. Get the current major from the installed Chrome (`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version`) — the gate floors at "current minus `browserSupport.versionsBack`".
- Launch: `chromium.launch({ headless: true })` → `newContext({ viewport:{width:1440,height:900}, userAgent: UA })`.
- Login: goto app root, wait ~3s, `fill('input[type="email"]', EMAIL)`, `fill('input[type="password"]', PASSWORD)`, click "Log in", wait ~9s → `/dashboard`. Save `ctx.storageState({path})` and reuse it so per-issue scripts skip login.
- Credentials come from the **user** (it's their test environment). `admin@tamanu.io` / `admin` is the usual seeded RC admin. Never enter non-test credentials.
- SPA timing: prefer `waitForTimeout` after navigations/clicks over `networkidle`.
- Keep scripts and screenshots in a scratch dir; screenshot every decision point and Read the image.

### 4. Classify testability before diving in — and say what you can't reach

A headless **facility-web admin** session cannot reach everything. Triage each issue:

- **Facility web, admin-testable** — do these (lab/encounter/medication/patient flows).
- **Central admin** (`central.…-rc`) — reference-data Manage edits are testable; anything needing an **import/export file** you don't have is BLOCKED (don't fabricate spreadsheets).
- **Needs a limited-permission user** — "forbidden when missing permission X" cases can't be reproduced as full admin; BLOCKED unless you create a role+user. These are usually better covered by the PR's integration tests.
- **Mobile app** — cannot be tested via a browser; BLOCKED (needs device/emulator).
- **Not in this build** — merged to `main` only, or PR closed; BLOCKED/NOT-PRESENT.

Report the BLOCKED ones with the specific reason so the user knows exactly what still needs manual/mobile/central/limited-user testing.

### 5. Per-issue method

For each testable issue: read its Slack post (and thread) for the **repro steps** and the **expected** behaviour; judge against the expected behaviour (card/spec/previous version), not the code. Reproduce the steps headless, capture the decisive screenshot, and assign PASS / FAIL / BLOCKED. Create whatever test data the flow needs (encounters, prescriptions) — that's expected on a QA RC.

### 6. Safety on a shared RC

The RC is shared with QA. Creating test data (patients, encounters, prescriptions) is fine; avoid changes that could break the environment:

- **Don't commit destructive saves to probe a guard.** E.g. the duplicate-NHN check: saving a real duplicate can break sync — test the **client-side** validation only (type + blur, observe the error, don't save).
- **Revert any settings you toggle** (e.g. making a field required) when done.
- Confirm cleanup in your report.

### 7. Parallelise and compile

For a large set, fan out: one subagent per app surface (facility, central), each given the recipe above and its issue list, each returning a matrix. Hand each subagent the login recipe and the **UA gate** explicitly — it's the #1 thing that silently wastes their time. Then compile one matrix.

### Output

A single matrix, one row per in-scope issue:

| # | Issue | Verdict | Evidence | Screenshot |
|---|-------|---------|----------|------------|

Verdict ∈ **PASS / FAIL / BLOCKED** (BLOCKED carries the reason: mobile / needs file / needs limited user / not in build / env down). Evidence is one line on what was actually observed. Close with: which issues still need a route you couldn't take, so QA knows the remaining manual surface.
