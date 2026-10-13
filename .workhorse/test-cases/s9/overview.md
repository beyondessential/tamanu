# Self check-in kiosk: test cases

## Finding the appointment

- [ ] Last name (any case, padded with spaces) and exact DOB with an appointment today at this facility returns one match (verifies spec: KIOSK)
- [ ] Patient with an appointment tomorrow, or yesterday, is not found (verifies spec: KIOSK)
- [ ] Patient with an appointment today at another facility is not found (verifies spec: KIOSK)
- [ ] Cancelled and no-show appointments today are not found (verifies spec: KIOSK)
- [ ] Two patients with the same last name and DOB both booked today return two masked matches with no clinician (verifies spec: KIOSK)
- [ ] Wrong DOB returns no matches, and the no-match screen shows the searched details (verifies spec: KIOSK)
- [ ] Appointment already Arrived shows the already-checked-in screen (verifies spec: KIOSK)
- [ ] Search without permission to read appointments is forbidden
- [ ] Kiosk endpoints return an error when the kiosk setting is off for the facility (verifies spec: KIOSK)

## Forms

- [ ] Forms configured for the appointment type are listed; an appointment type with none goes straight to Ready to check in (verifies spec: KIOSK)
- [ ] Next with an unanswered required question stays on the page, scrolls to it and shows "This question is required" (verifies spec: KIOSK)
- [ ] Answering clears the message (verifies spec: KIOSK)
- [ ] Moving between forms keeps answers; a completed form can be reopened (verifies spec: KIOSK)
- [ ] Unsupported question types are not shown (verifies spec: KIOSK)
- [ ] A long page scrolls with the title and buttons fixed (verifies spec: KIOSK)

## Checking in

- [ ] Check in creates one survey response per form for the patient at this facility and sets the appointment to Arrived (verifies spec: KIOSK)
- [ ] Check in with a form missing is rejected and nothing is saved (verifies spec: KIOSK)
- [ ] Check in for an appointment at another facility, or not today, is rejected (verifies spec: KIOSK)
- [ ] Check in a second time is rejected (verifies spec: KIOSK)
- [ ] Checked-in screen returns to the landing page on Done and on its own (verifies spec: KIOSK)

## Session

- [ ] Start over asks for confirmation and clears the session (verifies spec: KIOSK)
- [ ] Inactivity warning counts down and clears the session; "I'm still here" dismisses it (verifies spec: KIOSK)
- [ ] Language, text size and high contrast reset when a session ends (verifies spec: KIOSK)
- [ ] With one language, the header button reads Accessibility (verifies spec: KIOSK)
- [ ] Extra-large text and high contrast render every screen without clipping
- [ ] Kiosk stays signed in past the token duration
