### Changes

Adds a **Write user guide** skill for authoring and maintaining Tamanu's end user manuals, with the spec that defines their conventions, a scaffolded manual tree, and the tooling that generates its navigation and captures screenshots. 48 files, additions only apart from two new npm scripts in `package.json` and one new CI job.

**The skill**: `.agents/skills/write-user-guide/SKILL.md`. A run covers one module on one platform. Each step is grounded in the running app, screenshots are captured, the GitHub render is checked, and the change lands as a reviewed PR.

**The standard**: `specs/documentation/user-manuals.md`, a new `documentation` spec area covering structure, guide anatomy, scope, language, numbering, screenshots and generated navigation. A guide has an intro, an optional "Before you start" and numbered steps, and it ends with its last step.

**The manual**: `docs/user-manuals/`, scaffolded with 35 module folders across Desktop (22) and Mobile (13). Each level has a `README.md` index, matching the convention in the configuration guides PR (#11119). One worked example is included, `10.1 Record a set of vitals`, written against the current Vitals implementation. Guides describe how the product works, not how a particular site is configured, so they apply at every deployment.

**The tooling**

- `docs/user-manuals/manifest.json` is the authoritative list of platforms, modules and guide order. `scripts/build-user-manuals.mjs` generates every index, both numbering levels, the back-links and the previous/next links. It also validates the manifest and reports missing images, empty alt text, unlisted or stray guides, and orphaned module folders. It only checks the platforms it owns, so sibling trees such as `docs/user-manuals/config-guides/` are left alone.
- A new `user-manuals` CI job runs `npm run check-user-manuals`, so a hand-edited index or a stale number can't land. It needs no `npm install`.
- `scripts/capture-user-manual-screenshot.mjs` captures one screenshot per run against a configurable Tamanu. It reads credentials from `packages/e2e-tests/.env`, so an existing e2e setup needs no further configuration.

**Review fixes.** Bugbot and Review Hero raised issues over three rounds, and each one was checked against the source before it was fixed. The notable ones:

- The capture script would have silently photographed the facility picker instead of the requested page. `App.jsx:74` renders the picker whatever the URL is, so it now waits for the authenticated shell.
- The capture script now reads the e2e `.env`, keeps any subpath in the base URL, closes the browser on failure, and reports bad flags cleanly.
- The generator's back-link handling now copes with CRLF line endings and near-miss formatting. Before, these could leave a guide with two back-links, or report every file as changed on a Windows checkout.
- An all-blank vitals submission is refused by the app (`VitalsForm.jsx:118`), and the exemplar now says at least one reading is needed.
- An orphan check at the manuals root would have failed CI as soon as #11119 merged. That check is now limited to the platforms this manifest owns.

**Verified.** The generator is tested for idempotency, renumbering, previous/next linking, orphaned and stray files, image validation, manifest validation, CRLF input and working-directory independence. CI's `eslint . --quiet` reports no errors in either script.

**Not verified, and worth a reviewer's attention:**

- `capture-user-manual-screenshot.mjs` has never taken a real screenshot. Its argument handling, environment loading and failure paths are tested. The login, navigation and capture path needs a running Tamanu.
- No committed module holds two guides yet, so previous/next linking isn't exercised in this branch. It was verified during development with a temporary second guide.
- Mobile has no screenshot tooling, so mobile screenshots are taken by hand.
- Once #11119 merges, the root `README.md` won't link to the configuration guides yet. Adding that link is a manifest change for whichever PR merges second.

### Auto-Deploy

- [ ] **Deploy** <!-- #deploy -->

<details>
<summary>Options</summary>

- [ ] Artillery load test <!-- #deployopt %synthetic -->
- [ ] Seed from closest snapshot <!-- #deployopt %seed-snapshot -->
- [ ] Generate fake data <!-- #deployopt %fakedata=1 -->
- [ ] More data (20Gi) <!-- #deployopt %dbstorage=20 -->
- [ ] No facility servers (central-only) <!-- #deployopt %facilities=0 -->
- [ ] No sync (facility tasks scaled to zero) <!-- #deployopt %facilitytasks=0 -->
- [ ] Skip mobile build <!-- #deployopt %mobile=never -->
- [ ] Always build mobile <!-- #deployopt %mobile=always -->
- [ ] Stay up for 8 hours <!-- #deployopt %ttlhours=8 -->
- [ ] Stay up for 24 hours <!-- #deployopt %ttlhours=24 -->
- [ ] Stay up (no TTL) <!-- #deployopt %ttlhours=0 -->
- [ ] Build images only (don't deploy) <!-- #deployopt %imagesonly -->
- [ ] Build all images (amd64 + Windows; default is arm64 only) <!-- #deployopt %allimages -->
- [ ] Pause this deploy <!-- #deployopt %pause -->

</details>

### Tests

- [ ] **Run E2E tests** <!-- #e2e -->
- [ ] **Run DAST scan** <!-- #dast -->

### Review Hero

- [x] **Run Review Hero** <!-- #ai-review -->
- [ ] **Auto-fix review suggestions** <!-- #auto-fix --> _Wait for Review Hero to finish, resolve any comments you disagree with or want to fix manually, then check this to auto-fix the rest._
- [ ] **Auto-fix CI failures** <!-- #auto-fix-ci --> _Check this to auto-fix lint errors, test failures, and other CI issues._
- [ ] **Auto-merge upstream** <!-- #auto-merge --> _Check this to merge the base branch into this PR, with AI conflict resolution if needed._
- [ ] **Save suppressions** <!-- #save-suppressions --> _Check this to capture 👎 reactions on Review Hero comments as suppression rules in `.github/review-hero/suppressions.yml`. Also runs automatically at the end of any auto-fix run._

### Remember to...

- ...write or update tests
- ...add UI screenshots and **testing notes** to the Linear issue
- ...add any **manual upgrade steps** to the Linear issue
- ...update the [config reference](https://beyond-essential.slab.com/posts/reference-config-file-0c70ukly), [settings reference](https://beyond-essential.slab.com/posts/reference-settings-0blw1x2q), or any [relevant runbook(s)](https://beyond-essential.slab.com/topics/runbooks-bs04ml6c)
- ...call out additions or changes to **config files** for the deployment team to take note of

<!-- Thank you! -->
