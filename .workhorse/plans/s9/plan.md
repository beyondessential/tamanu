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
- **Accessibility**: kiosk styles are written in `em` against a root font size set by the text-size step; colours come from CSS custom properties swapped by high contrast.
- **Language**: uses the web `TranslationContext` (`updateStoredLanguage`), with languages from `/public/translation/languageOptions`. Restored to the language the kiosk opened with when a session ends.

## Build steps

- [ ] Settings schema: `kiosk` section in facility settings
- [ ] Facility-server `kiosk` routes + permission checks + feature gate
- [ ] Endpoint integration tests
- [ ] Web: route wiring outside the sidebar, token keep-alive
- [ ] Web: kiosk shell (header, panel, popups, accessibility, language)
- [ ] Web: landing, find, results (one, several, none, already arrived)
- [ ] Web: forms (list, renderer, touch question components, validation, scroll to first error)
- [ ] Web: ready, check-in, checked in, error state
- [ ] Web: Start over, Help, inactivity warning
- [ ] Translations for all kiosk copy (`kiosk.*` string IDs)
- [ ] Demo seed sub-command on central (patients, appointment types, appointments today, surveys, kiosk settings)
- [ ] Run the full stack locally, click through every state in a browser, fix what's found
- [ ] Lint, run touched test suites
- [ ] Push, PR with deploy
