# Mercy Hospital autodeploy site

No code change: the site is this card's PR deploy, provisioned without standard reference data, then given Mercy Hospital's facility, areas, locations and departments by import. The PR is never merged.

## The deploy

The deploy line in the PR body reads:

```
- [x] **Deploy** <!-- #deploy --> %config=demo %facilities=1 %ttlhours=0
```

- **`%config=demo`** picks the infra repo's `demo` provisioning template instead of the PR default. It creates only the `admin@tamanu.io` / `admin` user, the facilities and a few settings, and seeds no reference data and no programs. The `pr` template would import the full default reference data (`defaultSpreadsheet: true`), the 12 test role users and three programs. Fake data and the snapshot seed stay off, as they are by default.
- **`%facilities=1`** runs one facility server, `facility-1`, which becomes Mercy Hospital. The template names it Test Facility 1 until the import renames it.
- **`%ttlhours=0`** stops the site suspending 4 hours after each deploy.
- The deploy name is `workhorse-b14`, so the site is at `https://central.workhorse-b14.cd.tamanu.app` and `https://facility-1.workhorse-b14.cd.tamanu.app`.
- Checked against `parseDeployConfig` in `packages/scripts/src/ghaCdHelpers.mjs`: the line parses to `config: demo`, `facilities: 1`, `ttlhours: 0`, `fakedata: 0`, no snapshot seed.
- A daily sweep unticks the deploy box, tearing the site down with its data, once the PR has had no activity for 7 days, so the PR needs a push or comment at least weekly. Closing the PR tears the site down a day later.
- This machine has no GitHub login, so the PR body is edited by hand.
- The PR shows Check spec format failing. It comes from main, not this branch: `specs/program-registry/form-conditions.md` and `registration.md` write their criteria as checkboxes, and the check runs on the merge with main. This branch changes no spec files. It does not block the deploy.
- Tick the box by editing the body text, changing `[ ]` to `[x]` and adding the options in the same save. Clicking the rendered checkbox saves at once and starts a deploy with the default options, which provisions the standard reference data before the options can be added.
- Changing the options on a running deploy redeploys onto the same database, and provisioning only adds. To start clean, untick, wait for the site to stop responding, then tick again.

## Reference data

Drawn from mercyhospital.org.nz (November 2026). The import workbook is `mercy-hospital-reference-data.xlsx` in this folder, with four sheets: Facilities, Location Group, Locations and Departments. The same rows are in `reference-data/` as JSON5, in the format of `defaultProvisioningData`.

**Facility**: `facility-1` becomes Mercy Hospital (code `MercyHospital`), 72 Newington Avenue, Maori Hill, Dunedin, 03 464 0107. Manaaki by Mercy, Mercy Heart Centre and Mercy Cancer Care are areas of it rather than facilities of their own, since the site runs one facility server.

**Areas and locations**: the names come from the site. Bed, bay, chair and room counts are invented, because the site gives none, except the 22 Marinoto Clinic suites. The site puts nine operating theatres across the main theatre suite and Manaaki's two.

| Area | Locations | Bookable |
|---|---|---|
| Reception | Mercy Hospital Reception, Manaaki Reception | No |
| Coolock Day Surgery Unit | Bed 1–12 | Weekly |
| Operating Theatres | Theatre 1–7 | Daily |
| Post Anaesthetic Care Unit | Bay 1–6 | No |
| Intensive Care Unit | Bed 1–4 | No |
| McAuley Ward | Bed 1–20 | Weekly |
| Callaghan Ward | Bed 1–20 | Weekly |
| Mercy Heart Centre | Cardiac Catheterisation Lab | Daily |
| Manaaki Day Stay Unit | Manaaki Theatre 1–2, Recovery Bay 1–4 | Daily |
| Mercy Cancer Care | Chemotherapy Chair 1–6, Consulting Room | All |
| Physiotherapy | Treatment Room 1–3 | All |
| Marinoto Clinic | Suite 1–22 | All |

Beds, bays, chairs, theatres and the cath lab hold one patient. Left out: Mercy Care East's tenant practices, and Pacific Radiology and Awanui Labs at Marinoto Clinic, which are separate providers.

**Departments**: the site's 18 services, each a department of Mercy Hospital: Anaesthetics, Bariatric Surgery, Breast Surgery, Cardiothoracic Surgery, Endoscopy, ENT Surgery, Eye Surgery, General Surgery, Gynaecological Surgery, Interventional Cardiology, Liver Surgery, Neurosurgery, Oncology, Oral and Maxillofacial Surgery, Orthopaedic Surgery, Physiotherapy, Plastics and Reconstructive Surgery, Urological Surgery.

**Survey defaults**: the `demo` template sets facility-1's default survey location and department to `WaitingArea` and `Emergency`, which won't exist. The facility server only logs that, but surveys and vitals recorded without an encounter need real codes, so they move to `MercyReception` and `GeneralSurgery`.

## Seeded on the site

Added through the API on 10 November 2026, after the clean deploy was tested.

- **Areas, locations and departments**: the Location Group, Locations and Departments sheets of the workbook, imported on central. The Facilities sheet was left out, so facility-1 is still named Test Facility 1.
- **Roles**: Doctor (`doctor`) and Nurse (`nurse`), both with the practitioner permission set from `packages/shared/src/roles.js`, imported as Roles and Permissions sheets.
- **Users**: 10 clinicians who sign in with the password `test`, at `firstname.lastname@demo.tamanu.io`. Doctors are Hannah Mitchell, Rangi Parata, Priya Raman, James Sutherland and Mele Taufa. Nurses are Sophie McKenzie, Aroha Tipene, Liam O'Connor, Grace Chen and Tom Henderson.
- **Patients**: 100 test patients registered at facility-1, with Dunedin and wider Otago addresses and a mix of NZ European, Māori, Pacific and Asian names. Most are adults, a third are over 65. There are no phone numbers, because the API drops a leading zero. Roy Antonini was already there.
- **Vitals**: the Vitals program and its one survey (28 questions), copied from the presentation site's `program-patientvitals` export. It refers to no reference data.
- The seeding scripts live outside the repository, in `/tmp/b14/seed/`. The patient script is seeded, so a re-run finds the same 100 patients and skips them.

## Steps

- [x] Work out how to deploy without standard reference data (`%config=demo`)
- [x] Build the Mercy Hospital reference data workbook from the website
- [x] Tick the deploy box in the PR body, with the line above (checked after deploy: facility-1 only, no reference data, no programs)
- [x] Import the areas, locations and departments on central
- [ ] Import the Facilities sheet, renaming facility-1 to Mercy Hospital
- [ ] Set facility-1's `survey.defaultCodes` to `MercyReception` and `GeneralSurgery` (admin panel, Settings, facility scope)
- [x] Check after a sync: facility-1 has its 12 areas, 110 locations and 18 departments, and no other reference data
- [x] Add Doctor and Nurse roles, 10 clinician users and 100 test patients
- [x] Copy the Vitals program from the presentation site
- [ ] Keep the PR open, with a push or comment at least once a week
