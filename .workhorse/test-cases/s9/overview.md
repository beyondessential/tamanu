# Self check-in kiosk: test cases

## Finding the appointment

- [x] Last name (any case, padded with spaces) and exact DOB with an appointment today at this facility returns one match (verifies spec: KIOSK)
- [x] Patient with an appointment tomorrow, or yesterday, is not found (verifies spec: KIOSK)
- [x] Patient with an appointment today at another facility is not found (verifies spec: KIOSK)
- [x] Cancelled and no-show appointments today are not found (verifies spec: KIOSK)
- [x] Two patients with the same last name and DOB both booked today return two masked matches with no clinician (verifies spec: KIOSK)
- [x] Wrong DOB returns no matches, and the no-match screen shows the searched details (verifies spec: KIOSK)
- [x] Appointment already Arrived shows the already-checked-in screen (verifies spec: KIOSK)
- [x] Search without permission to read appointments is forbidden
- [x] Kiosk endpoints return an error when the kiosk setting is off for the facility (verifies spec: KIOSK)

## Forms

- [x] Forms configured for the appointment type are listed; an appointment type with none goes straight to Ready to check in (verifies spec: KIOSK)
- [x] Next with an unanswered required question stays on the page, scrolls to it and shows "This question is required" (verifies spec: KIOSK)
- [x] Answering clears the message (verifies spec: KIOSK)
- [x] Moving between forms keeps answers; a completed form can be reopened (verifies spec: KIOSK)
- [x] Unsupported question types are not shown (verifies spec: KIOSK)
- [x] A long page scrolls with the title and buttons fixed (verifies spec: KIOSK)

## Checking in

- [x] Check in creates one survey response per form for the patient at this facility and sets the appointment to Arrived (verifies spec: KIOSK)
- [x] Check in with a form missing is rejected and nothing is saved (verifies spec: KIOSK)
- [x] Check in for an appointment at another facility, or not today, is rejected (verifies spec: KIOSK)
- [x] Check in a second time is rejected (verifies spec: KIOSK)
- [x] Checked-in screen returns to the landing page on Done and on its own (verifies spec: KIOSK)

## Session

- [x] Start over asks for confirmation and clears the session (verifies spec: KIOSK)
- [x] Inactivity warning counts down and clears the session; "I'm still here" dismisses it (verifies spec: KIOSK)
- [x] Language, text size and high contrast reset when a session ends (verifies spec: KIOSK)
- [x] With one language, the header button reads Accessibility (verifies spec: KIOSK)
- [x] Extra-large text and high contrast render every screen without clipping
- [ ] Kiosk stays signed in past the token duration
- [x] Portrait tablet layout keeps the forms list, form and actions usable
- [x] Reopening a completed form starts at its first page with answers kept
- [ ] Check-in failure shows the reception message and keeps answers (verifies spec: KIOSK)
