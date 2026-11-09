# Mercy Hospital v2.66 web demo

No code change: the demo is a long-lived autodeploy brought up by a GitHub control issue, then dressed as Mercy Hospital through the API. It follows the Honduras demo's setup (branch `honduras-demo`, control issue #8270).

## Decisions

- **Dedicated branch `mercy-demo`**, created on the `v2.66.1` tag, the latest released v2.66. The Honduras demo's branch sits exactly on its release tag (v2.42.6) in the same way. The deploy name comes from the branch, so the address is `mercy-demo.cd.tamanu.app` rather than `release-2-66-…`.
- **Own control issue** titled `Auto-deploy: mercy-demo`, with an unnamed `#deploy`. Pushes to `mercy-demo` redeploy the demo, and nothing else touches it: hotfixes arrive only when someone moves the branch to a later v2.66 tag.
- **Options**: Honduras's `%facilities=1 %config=basic`, plus `%ttlhours=0` and `%mobile=never`. The TTL option postdates the Honduras issue and now defaults to auto-suspending after 4 hours, so a long-lived demo needs it off. `%mobile=never` skips the APK build for a web-only demo.
- **Data**: start from default provisioning (no seed snapshot or fake data), then seed Mercy-specific demo data through the API with the seed-demo-data skill.
- Namespace `tamanu-mercy-demo`. Issue-controlled deploys are skipped by the stale-deploy sweep and torn down only when the issue is closed.

## Branch

```sh
git push origin 'v2.66.1^{commit}:refs/heads/mercy-demo'
```

## Control issue

Label `auto-deploy`, title `Auto-deploy: mercy-demo`, body:

```markdown
_This is a control issue for an Auto-Deploy. See [auto-deploy docs](https://beyond-essential.slab.com/posts/tamanu-auto-deploys-kubernetes-kkovoquc#h9fd9-non-pr-branches) for more._

Long-lived web demo of v2.66 for Mercy Hospital (Workhorse card Y13).

### Deploy <!-- #branch=mercy-demo -->

- [x] **Deploy to Tamanu Internal** <!-- #deploy --> %facilities=1 %config=basic %ttlhours=0 %mobile=never
```

Checked against `parseBranchConfig` and `parseDeployConfig`: resolves to ref `mercy-demo` and one enabled deploy, `mercy-demo`.

## Steps

- [x] Work out the deploy mechanism and draft the control issue
- [ ] Push the `mercy-demo` branch at `v2.66.1` (needs GitHub push access; this machine has none)
- [ ] Create the control issue on GitHub, after the branch exists
- [ ] Watch the CD run for the issue: images for the branch, then `deploy-up` for `mercy-demo`
- [ ] Confirm `https://central.mercy-demo.cd.tamanu.app/api/public/ping` returns `{ ok: true }` and the facility server reports v2.66.1
- [ ] Rename `facility-1` to Mercy Hospital through the central admin API, and wait for it to sync to the facility server
- [ ] Seed Mercy Hospital demo data (locations, clinicians, patients, appointments) with the seed-demo-data skill
- [ ] Share the web address and demo credentials with the card
