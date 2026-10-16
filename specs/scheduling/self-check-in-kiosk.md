---
id: KIOSK
---

# Self check-in kiosk

A tablet at a facility where patients check themselves in for today's appointment: they find their appointment by last name and date of birth, confirm who they are, complete the forms their appointment needs, and check in. The kiosk runs inside Tamanu web on a tablet signed in with a staff account, so it reads and writes the facility it is signed in to.

## Availability

- [ ] The kiosk is turned on per facility by the kiosk setting, and is reached at its own address in Tamanu web, without the sidebar or any other part of the staff interface.
- [ ] Where the kiosk is turned on, Facility admin in the sidebar has a Self check-in kiosk item, marked as opening in a new tab, which opens the kiosk in a new browser tab. Where it is turned off, the item isn't shown.
- [ ] Where the kiosk is turned off for the facility, the kiosk address shows a short message that the kiosk is unavailable.
- [ ] The kiosk keeps its staff sign-in alive while it is open, so it does not sign itself out between patients.
- [ ] The kiosk can be open in one browser tab while Tamanu is open in another. Tamanu's limit of one open tab doesn't apply to kiosk tabs, so a kiosk tab neither blocks Tamanu nor is blocked by it.
- [ ] Every kiosk action is limited to the facility the tablet is signed in to; the kiosk cannot be pointed at another facility.
- [ ] The signed-in account needs permission to read appointments and patients to find appointments, and permission to update appointments and create form responses to check patients in.

## Layout

- [ ] Every screen has a header with the Tamanu logo, the facility name, the language and accessibility button, and Help. Every screen after the landing page also has Start over.
- [ ] Content sits in a white outlined panel. Controls are sized for touch.
- [ ] The layout is designed for a landscape tablet and remains usable in portrait.

## Landing page

- [ ] While idle, the kiosk shows a welcome naming the facility and a Start check-in button, which opens Find your appointment.

## Language and accessibility

- [ ] The header button opens a popup with a choice of language, text size in three steps, and high contrast. Changes apply straight away, and Done closes the popup.
- [ ] The languages offered are those the deployment has translations for. Each is shown by its own name.
- [ ] Where only one language is available, the header button reads "Accessibility" and opens a smaller popup with text size and high contrast only.
- [ ] Text size and high contrast apply to every kiosk screen, including forms and popups.
- [ ] When a session ends (check-in complete, Start over, or inactivity), language, text size and high contrast return to the kiosk's defaults for the next patient. Choices made on the landing page are cleared the same way after the inactivity period.
- [ ] The kiosk's default language is the one it was opened in.

## Finding the appointment

- [ ] The patient enters their last name and date of birth. The date of birth is entered as day, month (chosen by name) and year.
- [ ] Find my appointment is available once all fields are filled in with a valid date.
- [ ] A patient is found only when they have an appointment today at this facility that has not been cancelled or marked as a no-show. Patients without such an appointment are never shown.
- [ ] Matching ignores letter case and surrounding spaces in the last name, and requires the exact date of birth.
- [ ] Back returns to the landing page.

## Results

- [ ] One match shows "Is this you?" with a tile showing first, middle and last name, date of birth, sex, patient ID, and the appointment time and clinician. "Yes, this is me" continues; "No, this isn't me" shows the no-match screen.
- [ ] Matches for more than one patient show "Select your details" with a tile per appointment, with copy making clear the matches are different patients. No tile is preselected, and Continue is unavailable until the patient chooses one. "None of these are me" shows the no-match screen.
- [ ] One patient with more than one appointment today instead chooses between their own appointments: their details are shown once, and each appointment is offered by its time and clinician. Nothing about their record is hidden from them.
- [ ] Tiles shown for several patients carry only the appointment time (no clinician), and show the patient ID's first four characters with the rest as asterisks. The full patient ID and clinician are never sent to the tablet until a single patient is chosen.
- [ ] No match shows the details that were searched and directs the patient to reception, with Close (back to the landing page) and Edit details (back to the search with their entries kept).
- [ ] A patient whose appointment has already moved past Confirmed (for example Arrived or Seen) sees that they are already checked in and is directed to take a seat, without repeating their forms. Check-in only ever moves an appointment from Confirmed to Arrived.
- [ ] Dates of birth are shown with the month as a word, for example 14 March 1986. Appointment times are shown in the facility's timezone.

## Forms

- [ ] The forms a patient completes are set per appointment type by the kiosk setting. Forms that have been retired are left out. An appointment type with no forms goes straight to Ready to check in.
- [ ] Forms can be completed in any order. A "Your forms" list beside the open form shows each form's status (Completed, In progress with its current page, Not started) and how many are complete; tapping a form opens it.
- [ ] After the patient confirms who they are, the first form opens.
- [ ] The open form shows its own page progress ("Page 2 of 3") with a progress bar.
- [ ] When a page is longer than the screen, the questions scroll while the form title, page progress and Back and Next stay in place.
- [ ] Form questions use the question types that patient-facing forms support. Questions of other types are left out of the kiosk.
- [ ] Questions that fill from the patient record show the patient's existing value. The tablet receives only the parts of the patient's record that the forms show, and only after the patient confirms who they are.
- [ ] Required questions are marked with a red asterisk. Tapping Next with required questions unanswered keeps the patient on the page, scrolls to the first unanswered required question, and shows "This question is required" under each one.
- [ ] A question's validation message clears as soon as it has a valid answer.
- [ ] Text answer fields grow taller as the patient types past their height.
- [ ] Next on a form's last page completes the form and opens the next form that is not complete; when all are complete, the main panel shows Ready to check in.
- [ ] Answers are kept on the tablet while the patient moves between forms and pages, so a completed form can be reopened and changed until the patient checks in. A reopened form opens at its first page and is in progress again until the patient reaches its end.
- [ ] Every form must be complete before the patient can check in.

## Checking in

- [ ] Ready to check in shows the appointment time and clinician, and the Check in button.
- [ ] Check in saves every completed form as a form response for the patient, recorded at this facility, and marks the appointment Arrived. Either all of these are saved or none are, and an appointment can only be checked in once.
- [ ] Form responses are recorded against the staff account the kiosk is signed in with.
- [ ] If check-in fails, the patient is told to go to reception and their answers are kept so they or staff can try again.
- [ ] After check-in, "You're checked in" asks the patient to take a seat. Done, or a short wait, returns to the landing page.

## Help, Start over and inactivity

- [ ] Help opens a popup directing the patient to reception, with Close.
- [ ] Start over asks for confirmation, warning that any information entered will be lost (Cancel / Start over). Confirming clears the session and returns to the landing page.
- [ ] After a period without interaction during a session, the kiosk asks "Are you still there?" with a countdown, Start over and "I'm still here". When the countdown ends, the session is cleared and the kiosk returns to the landing page. The idle period and countdown are set by the kiosk setting.
