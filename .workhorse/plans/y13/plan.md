# Mercy Hospital v2.66 web demo

No code change: the demo is a long-lived autodeploy of `release/2.66` (v2.66.1 is the latest tag), brought up by a GitHub control issue and then dressed as Mercy Hospital through the API.

## Decisions

- **Separate control issue**, not a named deploy on the existing `Auto-deploy: release/2.66` issue (#11358). That issue's unscoped `#deployopt` lines (4 facilities, 20Gi) would apply to any deploy added to it, and editing it re-runs the rc deploy. The separate issue deploys the head of `release/2.66` when it is created or edited, so hotfixes reach the demo only when the issue is edited, which keeps the demo stable between demos.
- **No dedicated branch.** A Honduras-style `mercy-demo` branch would give a shorter address, but was set aside in favour of deploying `release/2.66` directly, so the address carries the branch: `release-2-66-mercy`.
- **Title** `Auto-deploy: release/2.66 Mercy Hospital demo`. Issue events accept any title starting `Auto-deploy: <branch>`, but branch pushes only follow an issue titled exactly `Auto-deploy: <branch>`, so this title leaves #11358 in charge of hotfix pushes.
- **Options**: `%facilities=1 %ttlhours=0 %mobile=never %config=rc`. One facility for Mercy Hospital, no auto-suspend, web only, and the same config template as the version's proven rc deploy. Facility subdomain stays the default `facility-1` so the API addresses match `.agents/docs/tamanu-api-access.md`.
- **Data**: start from default provisioning (no seed snapshot or fake data), copy the set-up from the presentation demo (below), then seed Mercy-specific patients and clinicians through the API with the seed-demo-data skill.
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

## Set-up copied from the presentation demo

Copied from `presentation.demos.tamanu.app` with the transfer-deployment-data skill. The source is only read. On 2026-11-09 it runs v2.66.1, the same version as this demo, with facility-1 its only facility server.

- **Reference data**: every type, keeping IDs. No patients, users or vaccinations.
- **Programs**: Surgical (`program-surgery`, all five forms), Patient Forms (all five, including Surgical consent), Pain assessment, Neurological assessment, Wound assessment and Vitals.
- **Facility and departments**: facility-1 renamed Mercy Hospital; facility-1's 27 departments copied unchanged. The presentation demo's other facilities are left behind.
- **Areas**: the 11 facility-1 areas renamed onto Mercy Hospital Dunedin (mercyhospital.org.nz), keeping their IDs, locations and bookability. Names in italics are invented, since the site does not name its wards or these rooms.

| Presentation demo area | Mercy Hospital area | Locations |
|---|---|---|
| Operating Theatre | Operating Theatres | Theatre 1–9 (daily-bookable) |
| Post-Anaesthesia Care Unit | Recovery | Bed 1 |
| Emergency Department | Intensive Care Unit | Bed 1–3, *Whānau Room* |
| Immunisation Clinic | Mercy Heart Centre | Cardiac Catheterisation Lab |
| OBGYN Clinic | Mercy Cancer Care | Chemotherapy Suite |
| Home Visit | Mercy Physiotherapy | Physiotherapy |
| Outpatient | Marinoto Clinic | *Consulting Rooms* |
| Radiology | Pacific Radiology | Radiology |
| Ward 1 | *Inpatient Ward* | Bed 1–22 (weekly-bookable) |
| Ward 2 | *Day Stay* | Bed 1–18 |
| Pre-Op | *Surgical Admissions* | Waiting Area |

- **Default areas, locations and departments** that default provisioning gives facility-1 are marked historical, so only the Mercy Hospital ones show.
- **Settings**: global, central and facility-1, merged into the demo's. Left out: secrets (Anthropic and Mailgun keys), `patientPortal.baseUrl` (the presentation site's portal), the mobile update channel, the Mailgun mail account and the mSupply integration. Facility-1's dispensing department moves from the presentation demo's second facility to its own Outpatient department, and the default form location moves from the old ED waiting area to Marinoto Clinic's Consulting Rooms.
- The AI patient summary is switched on by the copied settings but needs an Anthropic API key set on central before it works.

The exports and scripts live outside the repository, in `/tmp/y13` on the device this card is checked out to: `export.mjs` and `places.mjs` (done), then `import.mjs`, `hide-defaults.mjs` and `apply-settings.mjs`, each a dry run until given `--real`.

## Steps

- [x] Work out the deploy mechanism and draft the control issue
- [ ] Create the control issue on GitHub (needs someone with GitHub access; this machine has no `gh` or token)
- [ ] Watch the CD run for the issue: images for the `release/2.66` head, then `deploy-up` for `release-2-66-mercy`
- [ ] Confirm `https://central.release-2-66-mercy.cd.tamanu.app/api/public/ping` returns `{ ok: true }` and the facility server reports v2.66
- [x] Export the set-up and settings from the presentation demo, and prepare the Mercy Hospital places workbook and settings
- [ ] Dry-run then import reference data, places and programs (`import.mjs`)
- [ ] Hide the default facility-1 areas, locations and departments (`hide-defaults.mjs`)
- [ ] Merge the settings (`apply-settings.mjs`)
- [ ] After a sync, compare counts with the presentation demo and check the facility server shows Mercy Hospital and its areas
- [ ] Seed Mercy Hospital patients, clinicians and appointments with the seed-demo-data skill
- [ ] Share the web address and demo credentials with the card
