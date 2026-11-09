# Mercy Hospital web demo

No code change: the demo is an autodeploy dressed as Mercy Hospital Dunedin through the API.

## Where the demo runs

- **The card's own PR deploy**, PR #11627, at `https://central.workhorse-y13.cd.tamanu.app` and `https://facility-1.workhorse-y13.cd.tamanu.app`. Chosen on 2026-11-09 over the planned `release/2.66` control issue, which was never created.
- It runs **v2.69.0**, because the card's branch is based on main, not the v2.66 the card asked for.
- A PR deploy lives only as long as the PR and its TTL allow:
  - The deploy line in the PR body reads `- [x] **Deploy** <!-- #deploy --> %ttlhours=0`, or the site suspends 4 hours after each deploy. The deploy name stays `workhorse-y13`, so adding the option keeps the existing site and its data.
  - A daily sweep unticks the deploy box, tearing the site down with its data, once the PR has had no activity for 7 days. Someone pushes to the branch or comments on the PR at least once a week.
  - Closing the PR tears the site down a day later.
- It has two facility servers. Mercy Hospital is facility-1; facility-2 is left as provisioned.

### Suspended and failed deploy, 2026-11-09

No TTL option is ticked on the PR yet, so the site suspends 4 hours after each deploy, and each push to the branch wakes it for another 4. The next deploy, at 15:01 UTC, succeeded, and at 19:12 UTC the facility server still showed Mercy Hospital with its 11 areas, 60 locations and charts, so suspension keeps the data. The deploy that ran on the 13:32 push woke the site but then failed: Pulumi gave up after 30 minutes with the Argo CD application OutOfSync/Progressing, its sync waiting on the `central-migrator` hook job ([run](https://github.com/beyondessential/tamanu/actions/runs/42626375748)). The same branch deployed cleanly at 04:25 with the same migrations, so this is the deploy infrastructure rather than anything in the branch, which carries only this plan. If a re-run hangs the same way, the `central-migrator` job's own logs are the place to look, through Headlamp or `kubectl` against `tamanu-workhorse-y13`.

### Set aside: a long-lived release/2.66 deploy

If the demo has to be v2.66, the earlier design still applies: a separate control issue titled `Auto-deploy: release/2.66 Mercy Hospital demo`, labelled `auto-deploy`, with `#branch=release/2.66` and `- [x] **Mercy Hospital demo** <!-- #deploy=mercy --> %config=rc %facilities=1 %ttlhours=0 %mobile=never`. It would sit at `release-2-66-mercy.cd.tamanu.app`, and the scripts below would need re-pointing and re-running against it.

## Set-up copied from the presentation demo

Copied from `presentation.demos.tamanu.app` (v2.66.1) with the transfer-deployment-data skill. The source was only read.

- **Programs**: Surgical (all five forms), Patient Forms (all five, including Surgical consent), Pain assessment, Neurological assessment, Wound assessment and Vitals (replacing the default vitals survey's components). The deploy's own Immunisation and NCD Primary Screening programs are left as they are.
- **Reference data**: every type, keeping IDs, added to the deploy's defaults (so procedure types number 2,722 against the source's 1,592). No patients, users or vaccinations.
- **Facility and departments**: facility-1 renamed Mercy Hospital; facility-1's 27 departments copied unchanged.
- **Areas**: the 11 facility-1 areas renamed onto Mercy Hospital Dunedin (mercyhospital.org.nz), keeping locations and bookability. Names in italics are invented, since the site does not name its wards or these rooms.

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

- **Default areas, locations and departments** that provisioning gave facility-1 are marked historical. 17 default locations shared a code with a presentation location (`THOutpatient`, `THWard1Bed1` and so on), so those were renamed and moved into the Mercy areas rather than duplicated; they keep their default IDs.
- **Settings**: global, central and facility-1, merged into the deploy's. Disabled reports are the union of both sites' lists. Left out: secrets (Anthropic and Mailgun keys), `patientPortal.baseUrl`, the mobile update channel, the Mailgun mail account and the mSupply integration. Facility-1's dispensing department moves to its own Outpatient department, and the default form location to Marinoto Clinic's Consulting Rooms.

- **Roles**: the presentation demo's three custom roles with their permissions (Admin ICT, Medical Officer, Demo clinician; 465 permission rows). The built-in admin role is left alone. Demo clinician has no permissions at the source either.
- **Users**: 35 of the presentation demo's 38, all with the shared demo password the user chose, kept out of the repository. Left out: `admin@tamanu.io` (the deploy keeps its own admin) and the two real people's accounts, megan@bes.au and santosh.khanal@msupply.foundation, until the user decides on them. Users who listed specific facilities are limited to Mercy Hospital. Thirteen users hold roles the presentation demo never defined (Reception, Nurse, Pharmacist and so on), so they sign in with no permissions, as they do there.

### Adjusted or left out on the way in

- Drug routes mapped to v2.69's values (IV to intravenous, IM to intramuscular, Opthalmic to eye, Supp to rectal, and so on), and a triage reason ID's trailing space trimmed.
- Seven lab test panels left out, with their price-list and insurance-plan rows, because v2.69 refuses panels mixing test categories: Thyroid Function Test, CSF Chemistry, Others, Comprehensive Metabolic Panel (CMP), Bloods, PT, Coagulation Studies.
- The eight ward bed-fee invoice products point at the reused bed records and read "Inpatient Ward" or "Day Stay".
- Programs import before reference data, since procedure types link to the Surgical program's forms.

The exports and scripts are in `/tmp/y13` on the device this card is checked out to, outside the repository.

## Steps

- [x] Work out the deploy mechanism
- [x] Export the set-up and settings from the presentation demo and prepare the Mercy Hospital workbooks
- [x] Import programs, reference data and places into the PR deploy
- [x] Hide the default facility-1 areas, locations and departments
- [x] Merge the settings
- [x] Check after a sync: the facility server shows Mercy Hospital, its 11 areas and 60 locations, 27 departments, the forms, charts and vitals
- [ ] Add `%ttlhours=0` to the deploy line in PR #11627's body (needs GitHub access; this machine has none)
- [ ] Keep PR #11627 open, with a push or comment at least once a week
- [ ] Set an Anthropic API key on central if the AI patient summary should work (switched on by the copied settings)
- [x] Copy roles, permissions and users; sign-in checked on central and facility-1
- [ ] Once the site is awake, confirm a Medical Officer can list patients on facility-1 (403 before the roles had synced, when the site went to sleep)
- [ ] Decide whether megan@bes.au and santosh.khanal@msupply.foundation come across
- [ ] Seed Mercy Hospital patients, clinicians and appointments with the seed-demo-data skill
- [ ] Share the web address and demo credentials with the card
