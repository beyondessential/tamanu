### Changes

_Add a brief description of the changes in this PR to help give the reviewer context._

### Auto-Deploy

- [ ] **Deploy** <!-- #deploy -->

<details>
<summary>Options</summary>

- [ ] Synthetic test <!-- #deployopt %synthetic -->
- [ ] Generate fake data <!-- #deployopt %fakedata=1 -->
- [ ] More data (20Gi) <!-- #deployopt %dbstorage=20 -->
- [ ] No facility servers (central-only) <!-- #deployopt %facilities=0 -->
- [ ] No sync (facility tasks scaled to zero) <!-- #deployopt %facilitytasks=0 -->
- [ ] AMD64 architecture (default is arm64) <!-- #deployopt %arch=amd64 -->
- [ ] Skip mobile build <!-- #deployopt %mobile=never -->
- [ ] Always build mobile <!-- #deployopt %mobile=always -->
- [ ] Stay up for 8 hours <!-- #deployopt %ttlhours=8 -->
- [ ] Stay up for 24 hours <!-- #deployopt %ttlhours=24 -->
- [ ] Stay up (no TTL) <!-- #deployopt %ttlhours=0 -->
- [ ] Build images only (don't deploy) <!-- #deployopt %imagesonly -->
- [ ] Pause this deploy <!-- #deployopt %pause -->

</details>

### Tests

- [ ] **Run E2E tests** <!-- #e2e -->

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
