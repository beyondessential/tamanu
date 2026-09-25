# SOP: Set up the patient portal

The patient portal is a separate web app (`packages/patient-portal`) where
patients see parts of their record and fill in forms sent from Tamanu. It runs
on its own hostname and talks to central at `/api/portal` on that same hostname.
This SOP covers the basic setup a developer needs on an existing deployment. The
PM-facing configuration guide (email templates, supported question types,
permissions in detail) lives in Slab.

Every step changes the deployment, so it is **[dev-OTS]** by default
(`../README.md`).

## 1. Serve the portal

The portal calls `/api/portal` on whatever origin serves it
(`packages/patient-portal/src/api/TamanuApi.tsx`), so the portal host must serve
the SPA with an `index.html` fallback **and** reverse-proxy `/api/*` to the
central API. There is no separate API URL setting.

- **AWS Linux (ops-managed):** pull `beyondessential/ops`, run pulumi for the
  deployment (it adds the portal DNS record), then ansible install and ansible
  upgrade. The portal comes up at `patient.<deployment>.tamanu.app` (newer demos
  use `portal.<name>.demos.tamanu.app`). bestool only expects the
  `tamanu-patientportal` service while `features.patientPortal` is on, so after
  step 2 run `bestool tamanu start` to reconcile (`restart-services.md`) and
  check `bestool tamanu status`.
- **Kubernetes (Tamanu Internal PR deploys):** add the opsref to the deploy
  checkbox in the PR description:
  `- [x] **Deploy to Tamanu Internal** <!-- #deploy --> %opsref=patient-portal-pulumi`.
- **Windows:** unpack the `tamanu-patient-portal-<version>` release package and
  add a Caddy site for it (see the patient portal section of the Windows install
  page in Slab). `reverse_proxy /api*` must sit inside a `route` block ahead of
  `try_files`, otherwise `try_files` swallows the API calls and the portal
  loads but can't log in:

  ```caddy
  patient.example.tamanu.app {
      root * "C:\\tamanu\\tamanu-patient-portal-<version>"
      encode zstd gzip
      route {
          reverse_proxy /api* localhost:3000 localhost:3001 {
              health_uri /api/public/ping
          }
          try_files {path} /index.html
          file_server
      }
  }
  ```

- **On-premise / customer-hosted:** the portal hostname needs DNS and a TLS
  certificate just like central, so it has to be coordinated with the local IT
  team.

## 2. Settings

Admin panel → Settings, **Global** scope:

| Setting | Value | Why |
| --- | --- | --- |
| `features.patientPortal` | `true` | Off by default. While off, central answers `/api/portal` with 501 and the web app hides portal registration and "Send to patient portal". |
| `patientPortal.baseUrl` | e.g. `https://patient.example.tamanu.app`, no trailing slash | Builds the registration and login links in emails. Unset, every portal email errors with `Patient portal base URL is not configured (patientPortal.baseUrl)`. A trailing slash gives `//register` links. |

Older releases took the URL from central config `patientPortal.portalUrl`
instead; it has been the setting since v2.48.

Token lifetimes (`patientPortal.tokenDuration`, `loginTokenDurationMinutes`,
`registerTokenDurationMinutes`) are central-scope settings with sensible
defaults (24h session, 20 min login code, about a month for the registration
link).

## 3. Email

The portal login is a 6-digit code sent by email, so central must be able to
send mail: `mail.transport` (SMTP, password in `mail.transportPassword`) or
`mail.mailgun.*`, plus `mail.from`. These are central-scope settings and need a
restart; the legacy `mailgun` config is still read as a fallback.

- Login codes are sent straight away; if sending fails the login request errors
  with `Failed to send email`.
- Registration and form emails are queued in `patient_communications` and sent
  by the `PortalCommunicationProcessor` task (every 30s). Failures show up in
  the `patient_communication_errors` check (`../runbooks/report-and-error-rows.md`).

## 4. Permissions

- `create PatientPortalRegistration`: "Patient portal registration" under
  Patient resources.
- `create PatientPortalForm`: "Send to patient portal" in the Programs and
  Referrals form selector.
- `list` / `delete PatientPortalForm`: see and remove outstanding portal forms
  on the patient's Programs tab.

The built-in `practitioner` role lacks `list PatientPortalForm`; `admin` has
everything.

## 5. Smoke test

1. Open a test patient → Patient resources → Patient portal registration, and
   enter an inbox you can read. An email can belong to only one patient.
2. The invite goes out once the facility has synced to central and the task has
   run. Follow the link, then log in at `<baseUrl>/login` with the emailed code.
3. From the patient's Programs tab, pick a form → "Send to patient portal", and
   check it shows on the portal dashboard.

## Gotchas

- **Registration button missing:** the feature flag is off, the user lacks
  `create PatientPortalRegistration`, or the patient is recorded as deceased.
- **Portal forms list fails:** an outstanding assignment whose survey has no
  `code` fails validation and takes the whole list down (`SurveySchema` in
  `packages/shared/src/schemas/patientPortal/responses/survey.schema.ts`
  requires `code`). Give the existing survey a code; importing it again with a
  code creates a duplicate survey instead.
- **`Email is not verified` at login:** the patient hasn't used their
  registration link yet.
- **Invite never arrives:** check the facility is syncing, `baseUrl` is set, and
  mail works (section 3), in that order.
