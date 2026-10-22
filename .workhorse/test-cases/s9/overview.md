# Self check-in kiosk: test cases

## Finding the appointment

- [x] Last name (any case, padded with spaces) and exact DOB with an appointment today at this facility returns one match (verifies spec: KIOSK)
- [x] Patient with an appointment tomorrow, or yesterday, is not found (verifies spec: KIOSK)
- [x] Patient with an appointment today at another facility is not found (verifies spec: KIOSK)
- [x] Cancelled and no-show appointments today are not found (verifies spec: KIOSK)
- [x] Two patients with the same last name and DOB both booked today return two masked matches with no clinician (verifies spec: KIOSK)
- [x] One patient with two appointments today chooses between their own appointments, unmasked, with their details shown once (verifies spec: KIOSK)
- [x] Wrong DOB returns no matches, and the no-match screen shows the searched details (verifies spec: KIOSK)
- [x] Appointment already Arrived shows the already-checked-in screen (verifies spec: KIOSK)
- [x] Search without permission to read appointments is forbidden
- [x] Kiosk endpoints return an error when the kiosk setting is off for the facility (verifies spec: KIOSK)

## Forms

- [x] Tapping an outstanding form opens it straight away with no loading indicator flashing up (verifies spec: PPORT)
- [x] A slow page or panel shows a centred spinner after a moment, never "Loading…" text (verifies spec: PPORT)
- [x] Forms configured for the appointment type are listed; an appointment type with none goes straight to Ready to check in (verifies spec: KIOSK)
- [x] Next with an unanswered required question stays on the page, scrolls to it and shows "This question is required" (verifies spec: KIOSK)
- [x] Answering clears the message (verifies spec: KIOSK)
- [x] Moving between forms keeps answers; a completed form can be reopened (verifies spec: KIOSK)
- [x] Unsupported question types are not shown (verifies spec: KIOSK)
- [x] Patient data questions drawing on a program registry are left out rather than shown blank (verifies spec: KIOSK)
- [x] A long page scrolls with the title and buttons fixed (verifies spec: KIOSK)
- [ ] Back from the first page of a form returns to the previous form and leaves it Completed (verifies spec: KIOSK)

## Checking in

- [x] Check in creates one survey response per form for the patient at this facility and sets the appointment to Arrived (verifies spec: KIOSK)
- [x] Check in with a form missing is rejected and nothing is saved (verifies spec: KIOSK)
- [x] Check in for an appointment at another facility, or not today, is rejected (verifies spec: KIOSK)
- [x] Check in a second time is rejected (verifies spec: KIOSK)
- [x] Checked-in screen returns to the landing page on Done and on its own (verifies spec: KIOSK)
- [x] Each response is timed from when the patient opened that form to when they completed it, not from check-in (verifies spec: KIOSK)
- [x] Check in without permission to read patients or appointments is forbidden (verifies spec: KIOSK)
- [x] Viewing a patient from the kiosk leaves an access audit entry against the signed-in staff account (verifies spec: KIOSK)

## Session

- [x] Start over asks for confirmation and clears the session (verifies spec: KIOSK)
- [x] Inactivity warning counts down and clears the session; "I'm still here" dismisses it (verifies spec: KIOSK)
- [x] Language, text size and high contrast reset when a session ends (verifies spec: KIOSK)
- [x] With one language, the header button reads Accessibility (verifies spec: KIOSK)
- [x] Extra-large text and high contrast render every screen without clipping
- [x] Kiosk stays signed in past the token duration
- [x] The kiosk opens in a tab beside Tamanu, and Tamanu still opens beside it (verifies spec: KIOSK)
- [x] Facility admin's Self check-in kiosk item opens the kiosk in a new tab, signed in, and the staff tab stays usable (verifies spec: KIOSK)
- [x] The Self check-in kiosk item isn't shown where the kiosk is turned off (verifies spec: KIOSK)
- [x] Portrait tablet layout keeps the forms list, form and actions usable
- [x] Reopening a completed form starts at its first page with answers kept
- [x] Check-in failure shows the reception message and keeps answers (verifies spec: KIOSK)
- [ ] Playwright E2E spec covering the kiosk journey end to end in CI (needs the kiosk settings and a form wired into the shared e2e provisioning)

# Patient portal

Checked with scripted browser runs at a phone (390 wide) and a desktop (1280 wide) viewport, plus central API tests for the endpoints.

## Layout and dashboard

- [x] Enter followed by a tap on Log in sends the code once and signs in (verifies spec: PPORT)
- [x] A wrong code shows "Invalid verification code", and the right code then signs in (verifies spec: PPORT)
- [x] Reopening with a saved session the server rejects shows sign-in and forgets the saved session (verifies spec: PPORT)
- [x] Signing in one tab moves another tab on the code page to the dashboard; logging out in one signs the other out (verifies spec: PPORT)
- [x] Dashboard shows To do, Upcoming appointments and Your health record, in that order (verifies spec: PPORT)
- [x] Each outstanding form opens from its row; with none, "You're all up to date" (verifies spec: PPORT)
- [x] Record rows show how many are recorded, or "None recorded", and expand in place, by tap or keyboard; several can be open at once (verifies spec: PPORT)
- [x] Returning from editing details lands at Your details, clear of the header (verifies spec: PPDET)
- [x] With no procedures, or no vaccinations scheduled or recorded, the row says so once rather than under each subheading (verifies spec: PPORT)
- [x] Expanded rows list conditions, allergies, medications, vaccinations and procedures, or say none are recorded (verifies spec: PPORT)
- [x] Nothing overflows a phone-width screen, including success messages (verifies spec: PPORT)
- [x] Desktop keeps the single centred column

## Forms

- [x] A form keeps the same width from page to page on a desktop
- [x] A form with every question type renders on a phone with the shared controls, and Back and Next stay in view (verifies spec: PPORT)
- [x] Next with a required question unanswered shows "This question is required" and stays on the page (verifies spec: PPORT)
- [x] Submitting stores every answer in the staff formats (text, number, choices, yes/no, tick box, date, time, date and time, village search, photo, signature, calculated, patient data) and marks the form completed (verifies spec: PPORT)
- [x] A form whose questions override their options loads (verifies spec: PPORT)
- [x] Dates and times entered in a facility with its own time zone are stored in the primary time zone (verifies spec: PPORT)
- [x] Leaving a form with answers entered asks to discard them; an untouched form leaves without asking; submitting doesn't ask (verifies spec: PPORT)
- [x] An untouched form whose calculated question computes from prefilled answers still leaves without asking (verifies spec: PPORT)
- [ ] Closing or reloading the tab with unsaved answers or detail edits shows the browser's leave warning, including on Safari (verifies spec: PPORT, PPDET)
- [ ] Playwright E2E spec covering the portal journey: sign in, open an outstanding form, complete it, see it completed on the dashboard
- [ ] Playwright E2E spec covering editing patient details end to end: Edit, change a detail, Save, see it on the dashboard

## Patient details

- [x] Your details shows name, date of birth, sex and patient ID without expanding, with Edit beside its heading (verifies spec: PPDET)
- [x] More details expands into one grid of grouped details, leaving out empty details and empty groups; nothing shows "Not recorded" (verifies spec: PPDET)
- [x] Edit opens the edit screen at its top, not at the dashboard's scroll position (verifies spec: PPORT)
- [x] Edit opens one screen with the fixed details first, then every editable detail under its group heading, and Save fixed at the bottom (verifies spec: PPDET)
- [x] An invalid phone number or email shows a message under the field, the first one is focused, and nothing is saved (verifies spec: PPDET)
- [x] Saving writes only the changed details, returns to the dashboard at Your details with More details open, and shows "Details saved" (verifies spec: PPDET)
- [x] Leaving with unsaved changes asks to discard; Keep editing keeps the edits and Discard drops them (verifies spec: PPDET)
- [x] Title and ethnicity are chosen from lists and can be set back to None (verifies spec: PPDET)
- [x] Browser back button with unsaved changes shows the discard prompt (verifies spec: PPDET)
- [x] Hidden fields don't appear, and a required blank field anywhere on the edit screen blocks saving (verifies spec: PPDET)
- [x] The server keeps required details from being cleared, refuses hidden or non-editable details, non-current reference data and malformed phone numbers and emails (verifies spec: PPDET)
- [x] Changing email leaves the portal sign-in email unchanged (verifies spec: PPDET)
- [x] A label the deployment has renamed shows its renamed text in Your details and on the edit screen (verifies spec: PPDET)
- [x] A failed save shows its message above Save, in view, with the edits kept (verifies spec: PPDET)
- [x] A focused field with an error is clear of the header and the Save bar
- [x] A retired ethnicity still shows as chosen and can be set to None (verifies spec: PPDET)
- [x] A staff-recorded phone number in another format doesn't stop saving a different detail (verifies spec: PPDET)
- [x] Form start and end times are recorded in the primary time zone
- [x] If the time zone can't be loaded, the form page says the form couldn't be opened rather than going blank

