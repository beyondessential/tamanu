# Self check-in kiosk: implementation plan

Design: H9 storyboard (`.workhorse/design/mockups/h9/kiosk-check-in.html`). Spec: `specs/scheduling/self-check-in-kiosk.md` (KIOSK).

## Architecture

- **Web route** `/kiosk` in `packages/web`, rendered by `RoutingFacilityApp` outside the sidebar layout. It still goes through `App`'s gates (login, facility selection), so a staff account signs the tablet in first. The idle-logout monitor is not mounted; the kiosk refreshes its token on an interval instead (token duration defaults to 1h).
- **Facility-server endpoints** under `/api/kiosk`, scoped to `req.facilityId` from the JWT (never a client-supplied facility):
  - `GET /kiosk/appointments?lastName&dateOfBirth`: today's non-cancelled, non-no-show appointments at this facility whose patient matches. One match returns full tile data; several return masked data (display ID first four characters, no clinician).
  - `GET /kiosk/appointments/:id/forms`: the patient record plus the surveys configured for the appointment type, with components.
  - `POST /kiosk/appointments/:id/checkIn`: `{ responses: [{ surveyId, answers, startTime, endTime }] }`. In one transaction, creates a survey response per form via `SurveyResponse.createWithAnswers` and sets the appointment to Arrived. Rejects missing or extra forms, appointments not today or not at this facility, and appointments already Arrived.
- **Settings** (facility scope, `kiosk.*`): `enabled` (exposed to web), `formsByAppointmentType` (appointment type ID → survey IDs), `inactivityTimeout`, `inactivityWarning` (seconds, exposed to web).
- **Answers stay on the tablet** until check-in, so Start over and inactivity discard everything with nothing written.
- **Forms UI**: a kiosk renderer reuses ui-components `SurveyQuestion`, `getValidationSchema`, `getFormInitialValues`, `checkVisibility` and calculations, with its own page layout (title, page bar, scroll area, fixed Back/Next) and a kiosk question-type map of touch-sized controls.
- **Accessibility**: kiosk sizes are written through a `scaled()` helper that multiplies by a `--kiosk-scale` custom property set by the text-size step (1, 1.2, 1.4); colours come from custom properties swapped by high contrast.
- **Language**: uses the web `TranslationContext` (`updateStoredLanguage`), with languages from `/public/translation/languageOptions`. Restored to the language the kiosk opened with when a session ends.

## Build steps

- [x] Settings schema: `kiosk` section in facility settings
- [x] Facility-server `kiosk` routes + permission checks + feature gate
- [x] Endpoint integration tests
- [x] Web: route wiring outside the sidebar, token keep-alive
- [x] Web: kiosk shell (header, panel, popups, accessibility, language)
- [x] Web: landing, find, results (one, several, none, already arrived)
- [x] Web: forms (list, renderer, touch question components, validation, scroll to first error)
- [x] Web: ready, check-in, checked in, error state
- [x] Web: Start over, Help, inactivity warning
- [x] Translations for all kiosk copy (`kiosk.*` string IDs)
- [x] Demo seed sub-command on central (patients, appointment types, appointments today, surveys, kiosk settings)
- [x] Run the full stack locally, click through every state in a browser, fix what's found
- [x] Lint, run touched test suites
- [x] Web unit tests for dates, form preparation, session state
- [ ] Push, PR with deploy

## Notes from building it

- **Check-in location**: form responses are recorded at the appointment's location, else the first location in its clinic (location group), else the facility's default form location. The department is the facility's default form department (`survey.defaultCodes.department`), which must exist at the facility.
- **Session state**: answers live in a reducer on the tablet. Each form's Formik instance saves its values back when the patient changes page, switches form, or goes back. Saves are ignored once the session has left the forms step, so a form closing as Start over or inactivity ends the session can't carry answers into the next one.
- **Question controls**: the kiosk has its own touch controls for text, long text, number, single and multiple choice, yes/no, checkbox, date, time, date-and-time, photo, calculated and patient data, in `forms/questions/`. Dates are entered as day / month-by-name / year and stored as `yyyy-MM-dd`; times as hour / minute / am-pm stored as `HH:mm:ss`; date-and-time combines both and stores in the primary timezone through `toStoredDateTime`, matching the shared web field. A half-entered date or time asks to be finished rather than being silently dropped. Photo opens the camera and holds the `File` until check-in, using the shared file filter and size-limit setting. Patient-data relations (e.g. village) resolve to a name through `usePatientDataDisplayValue`. Submission date is set to today in the facility timezone and is not shown. Only search (autocomplete) and signature still reuse the web's own fields; other question types are left out.
- **Browser support**: the web app's browser gate (`browserSupport.policy`) defaults to Chromium-based browsers, and tablets are allowed by default. An iPad (Safari, or Chrome on iOS, both WebKit) needs the policy set to allow any browser.
- **Entering kiosk mode**: staff sign in as normal, then open `/kiosk`. Sign-in lands on the dashboard, so the address has to be typed after signing in. Exiting is by navigating away or signing out from another tab; the kiosk itself has no staff controls.
- **Demo data**: `TAMANU_ALLOW_FAKE_DATA=true npm run --workspace @tamanu/central-server start generate kioskDemo -- --facility <facility-id>` on central. It is idempotent, and re-running it moves the demo appointments to today and resets their statuses. The facility picks the changes up on its next sync once central's sync lookup has refreshed.
- **Kiosk account**: the tablet holds a full sign-in with no idle logout, so anyone who reaches the address bar has that account's access. The kiosk endpoints need only `read Appointment`, `read Patient`, `read Survey`, `write Appointment` and `create SurveyResponse`, so a dedicated role with just those contains it. Recommended for any real rollout; the demo can use any staff account.
- **Review fixes**: check-in moves an appointment only from Confirmed (anything further along shows "already checked in"); retired forms are skipped consistently by the form list and check-in; the appointment row is locked during check-in; the tablet receives only the patient fields the forms' patient-data questions use, and only after the patient confirms; reopening a completed form puts it back in progress; display choices left on the landing page are cleared after the inactivity period; the kiosk's default language is kept per tab, so a reload mid-session doesn't change it.
- **Shared signature field**: on a touchscreen the first stroke was lost, because the field only drew once focused and touch browsers focus an element after the tap ends. The field now focuses itself when a stroke starts, which fixes signing on any tablet, not just the kiosk. The kiosk wraps it with its own question text and a "Sign with your finger" hint.
- **Compact layout**: below a width scaled by the text size, the header shows icons only (labels stay as accessible names) and the forms list becomes a strip above the form, so portrait tablets and extra-large text both fit.
- **Several matches**: the search response says whether the matches are different patients or one patient's own appointments. Different patients get the masked "Select your details" tiles; one patient's own appointments are unmasked, their details stated once, and each appointment offered by its time and clinician.
- **E2E**: not added. A Playwright spec needs `kiosk.enabled` and a form wired to an appointment type in the shared e2e provisioning (facility-scoped settings, which the e2e suite has no helper for), and can't be validated locally without standing up a second full stack. Left as owed coverage in the test cases rather than committing an unverified, flaky spec. The journey is covered by 25 endpoint tests, 20 web unit tests, and scripted browser runs of every screen.
- **Separate bug found, not fixed here**: the shared `PatientDataDisplayField` (ui-components) reads a `value` prop, but `Field` passes formik's `field` object and never a bare `value`, so it renders blank wherever it is used — including the web survey view's patient-data relation questions. The kiosk no longer goes through it. Out of scope for this card; worth its own ticket.

# Patient portal redesign (second workstream on this card)

Asked for on this card even though it isn't strictly the kiosk: bring the portal into the kiosk's design language, share its form fields, and fold in G9's patient details editing in a way that works on a phone. The login flow stays as it is.

## Direction

- **Mobile app, not kiosk.** Same palette and shapes as the kiosk (warm grey page, white outlined panels, no shadows, Tamanu blue for actions), but phone-sized controls: the shared components scale down rather than being re-styled.
- **Dashboard leads with what needs doing**: forms to fill in, then upcoming appointments, then the health record as a list of rows that each open their own page (details, conditions, allergies, medications, vaccinations, procedures) instead of six accordions on one long page.
- **Patient details (G9)** gets its own page grouped like G9's spec. Each group is edited on its own short screen with Save always in view, rather than one whole-section inline form with Save a page of scrolling away.
- **Forms** use the kiosk's page layout and question components: page progress, question cards, required marking, scroll to the first missing answer, and Back/Next kept in view.

## Build steps

- [x] Portal survey responses: accept a question's own option list (the response schema rejected it, so any form whose questions override their options failed to load)
- [x] Move the kiosk's question components and date parts into ui-components, styled through custom properties with neutral defaults and a size multiplier; the kiosk keeps its look by setting them
- [x] Shared patient form page (pages, validation, calculations, scroll to first error) used by the kiosk and the portal
- [x] Central: `PUT /api/portal/me` for the patient-editable details, writing only what changed; expose the field settings the portal needs; reference data options for title/ethnicity/insurer/occupation
- [x] Portal: theme and layout (header, page shell, panels, back navigation)
- [x] Portal: dashboard, health record pages
- [x] Portal: patient details view and per-group edit screens, unsaved-changes prompt, saved message
- [x] Portal: forms on the shared form page
- [x] Specs: patient portal layout and patient details (from G9, adapted to per-group editing)
- [x] Tests: central API tests, shared component tests, kiosk regression bar before anything touching kiosk files is pushed
- [x] Run it locally on a phone-sized and a desktop viewport; fix what's found

## Notes

- **Local portal login**: the login code is only emailed, so `/tmp/s9-pp/portal-setup.mjs` (run from central-server with `node --import tsx`) gives Mele a registered portal account and mints a code the way the API tests do. Central needs `AUTH_SECRET` set locally, or every portal token is signed with a random secret and rejected straight after login.
- **Shared patient form components** live in ui-components (`components/PatientForm/`): the form page, every question control, date parts and the question-type map. They're styled only through `--pf-*` custom properties and sized through `--pf-scale`. The kiosk aliases these to its own `--kiosk-*` palette and text size, so it looks as it did; the portal sets the standard palette at a scale of 0.8, which gives phone-sized controls (inputs about 48px tall, 16px text, so iOS doesn't zoom on focus). Search questions are injected per app (`createPatientFormQuestionTypes({ AutocompleteQuestion })`), because the web and portal look options up differently.
- **Portal routing** moved to a data router (`createBrowserRouter`), which the unsaved-changes prompt needs (`useBlocker` doesn't work under `BrowserRouter`).
- **Portal time zones**: the shared date and time questions need the primary time zone, which the portal had no way to learn. `GET /api/portal/time-zone` returns it, and the facility time zone and date-time locale settings are now exposed to the portal, so date-time answers are stored exactly as staff's are. A separate endpoint rather than a key in the settings response, which the existing tests (rightly) hold to settings only.
- **Field settings** (`fields`, global) are exposed to the portal and read without a facility through `GET /api/portal/settings`, for hidden and required details.
- **Patient details editing**: the request schema (`UpdatePatientDetailsRequestSchema` in shared) is used by both the server and the portal's field validation, so their rules can't drift. Per-field updated-at tracking on patient additional data (the `set_updated_at_by_field` trigger) means a portal edit merges with staff edits field by field through sync.
- **G9's open question** (whether a required field that is already blank must be filled before saving) is decided here as yes, but only for the group being saved, since each group saves on its own.
- **Labels** reuse the web's `general.localisedField.*` string IDs, with portal-friendly fallbacks (Mobile phone rather than Primary contact number), so a deployment's renamed labels still apply.
- **Translations**: the portal loads the deployment's strings for its default language from central's public translation route (`/api/public/translation/default`), the way the web loads them from its facility, so renamed labels and reference data names apply. There's no language choice in the portal yet.
- **Review fixes** (fresh-eyes pass over the portal work): only changed details are format-checked, so staff-entered values in other formats don't block a save; a retired reference data choice stays visible; form start and end times are taken in the primary time zone; a failed time-zone load shows the form error rather than a blank page; the edit form keeps the fields it opened with if settings refresh; signing out isn't held by the discard prompt.
- **Local demo data**: `/tmp/s9-pp/portal-setup.mjs` and `/tmp/s9-pp/record-seed.mjs` (not committed) give Mele a portal account, forms and some health record.

