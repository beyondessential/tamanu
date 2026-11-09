# Mercy Hospital v2.66 web demo

No code change: the demo is a long-lived autodeploy of `release/2.66` (v2.66.1 is the latest tag), brought up by a GitHub control issue and then dressed as Mercy Hospital through the API.

## Decisions

- **Separate control issue**, not a named deploy on the existing `Auto-deploy: release/2.66` issue (#11358). That issue's unscoped `#deployopt` lines (4 facilities, 20Gi) would apply to any deploy added to it, and editing it re-runs the rc deploy. The separate issue deploys the head of `release/2.66` when it is created or edited, so hotfixes reach the demo only when the issue is edited, which keeps the demo stable between demos.
- **No dedicated branch.** A Honduras-style `mercy-demo` branch would give a shorter address, but was set aside in favour of deploying `release/2.66` directly, so the address carries the branch: `release-2-66-mercy`.
- **Title** `Auto-deploy: release/2.66 Mercy Hospital demo`. Issue events accept any title starting `Auto-deploy: <branch>`, but branch pushes only follow an issue titled exactly `Auto-deploy: <branch>`, so this title leaves #11358 in charge of hotfix pushes.
- **Options**: `%facilities=1 %ttlhours=0 %mobile=never %config=rc`. One facility for Mercy Hospital, no auto-suspend, web only, and the same config template as the version's proven rc deploy. Facility subdomain stays the default `facility-1` so the API addresses match `.agents/docs/tamanu-api-access.md`.
- **Data**: start from default provisioning (no seed snapshot or fake data), then seed Mercy-specific demo data through the API with the seed-demo-data skill.
- As of 2026-11-09 the head of `release/2.66` is the v2.66.1 code plus the version bump to 2.66.2, so the demo reports v2.66.2 until that patch is released.
- Deploy name `release-2-66-mercy`, namespace `tamanu-release-2-66-mercy`. Issue-controlled deploys are skipped by the stale-deploy sweep and torn down only when the issue is closed.

## Control issue

Label `auto-deploy`, title `Auto-deploy: release/2.66 Mercy Hospital demo`, body:

```markdown
_This is a control issue for an Auto-Deploy. See [auto-deploy docs](https://beyond-essential.slab.com/posts/tamanu-auto-deploys-kubernetes-kkovoquc#h9fd9-non-pr-branches) for more._

Long-lived web demo of v2.66 for Mercy Hospital (Workhorse card Y13).

### Deploy <!-- #branch=release/2.66 -->

- [x] **Mercy Hospital demo** <!-- #deploy=mercy --> %config=rc %facilities=1 %ttlhours=0 %mobile=never
```

Checked against `parseBranchConfig` and `parseDeployConfig`: resolves to ref `release/2.66` and one enabled deploy, `release-2-66-mercy`.

## Steps

- [x] Work out the deploy mechanism and draft the control issue
- [ ] Create the control issue on GitHub (needs someone with GitHub access; this machine has no `gh` or token)
- [ ] Watch the CD run for the issue: images for the `release/2.66` head, then `deploy-up` for `release-2-66-mercy`
- [ ] Confirm `https://central.release-2-66-mercy.cd.tamanu.app/api/public/ping` returns `{ ok: true }` and the facility server reports v2.66
- [ ] Rename `facility-1` to Mercy Hospital through the central admin API, and wait for it to sync to the facility server
- [ ] Seed Mercy Hospital demo data (locations, clinicians, patients, appointments) with the seed-demo-data skill
- [ ] Share the web address and demo credentials with the card
