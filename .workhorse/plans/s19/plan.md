# Base E2E tests for the kiosk and the patient portal

The kiosk has a page object and two specs (`tests/scheduling/kiosk.spec.ts`) but nothing past the
appointment search, and no forms. The portal has nothing: no frontend in the E2E stack, no way to
arrange a portal patient, no page objects. This card lays the groundwork for both and a base spec
per surface that later work extends.

## Decisions

- **Portal data is arranged in the central database.** The portal reads only central, central has
  no staff API that creates patients, and the E2E servers don't sync facility to central while tests
  run. A `utils/centralDatabase.ts` helper (plain `pg`, connection from `CENTRAL_DATABASE_URL`)
  creates a registered portal patient, issues a known login code, and assigns forms. This is the one
  place the suite writes to a database directly, and says so.
- **Sign-in goes through the real screens.** The test asks for a code on the Log in screen, then
  replaces the issued code with a known one (bcrypt-hashed constant) and types it in. Central sends
  the email through nodemailer's JSON transport (`mail.transport: { jsonTransport: true }` in E2E
  provisioning), so requesting a code succeeds and delivers nothing.
- **Forms come from the kiosk demo generator.** CI central setup runs
  `generate kioskDemo --facility facility-1` after provisioning, so its forms, appointment types and
  kiosk form settings reach the facility in the initial sync. Kiosk specs book its follow-up type
  (one form, Health questions); portal specs assign the same survey.
- **The portal is served from its production build** with `vite preview` on port 5175, proxying
  `/api` to central, like the web frontends.
- **Portal tokens share one secret per process.** Running the portal specs against a central with
  no `AUTH_SECRET` (as CI has) showed login signing with a random secret per token while the
  middleware verified against the unset one, so no session validated. Fixed in the portal router.

## Checklist

- [x] Plan and test cases
- [x] Portal served in E2E: `e2e-preview` script, Playwright `webServer` entry, `PATIENT_PORTAL_URL`
- [x] CI: install and build the portal, `CENTRAL_DATABASE_URL`, mail transport and kiosk demo in setup
- [x] `pg` dev dependency and `utils/centralDatabase.ts`
- [x] Portal page objects (`pages/patientPortal/`) and fixtures
- [x] Portal spec: sign in and out, wrong code, edit details, submit a form
- [x] Kiosk: forms on the page object; specs for completing forms, no match, Start over
- [x] Local setup docs (README, `.env.example`, `provisioning.local-example.json5`)
- [x] `llm/project-rules/playwright-e2e.md`: where kiosk and portal coverage lives
- [x] Run the new specs locally against a full stack
