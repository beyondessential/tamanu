# Base E2E tests for the kiosk and the patient portal

Each case is a Playwright spec in `packages/e2e-tests`; the id in brackets is its test title prefix.

## Self check-in kiosk

- [x] [KIOSK-0003] A patient with a follow-up appointment today completes the Health questions form, is held on a page while a required question is unanswered, and checks in (verifies spec: KIOSK)
- [x] [KIOSK-0004] A search with no appointment today shows the no-match screen with the searched last name and date of birth, and Edit details returns to the search with the entries kept (verifies spec: KIOSK)
- [x] [KIOSK-0005] Start over, confirmed, returns to the landing page, and the next check-in starts with an empty search (verifies spec: KIOSK)

## Patient portal

- [x] [PORTAL-0001] A registered patient asks for a code, signs in with it, sees the dashboard greeting them with nothing to do and their patient ID, and logs out to the Log in screen (verifies spec: PPORT)
- [x] [PORTAL-0002] A wrong code shows "Invalid verification code" and does not sign the patient in (verifies spec: PPORT)
- [x] [PORTAL-0003] A signed-in patient changes their mobile phone (labelled Primary contact number by the default reference data's translations), saves, and sees "Details saved" and the new number in Your details (verifies spec: PPDET)
- [x] [PORTAL-0004] A patient sent a form opens it from To do, is held on a page while a required question is unanswered, submits it, and sees "Form submitted" with To do all up to date (verifies spec: PPORT)
