---
id: PPORT
---

# Patient portal

The patient portal is where a patient signs in on their own phone or computer to see their upcoming appointments and health record, keep their details up to date, and fill in forms their clinic has sent them. It shares its look and its form controls with the self check-in kiosk (see `scheduling/self-check-in-kiosk.md`), sized for a phone rather than a tablet.

## Layout

- [ ] Every signed-in page has a header with the Tamanu logo, which returns to the dashboard, and a menu button that opens the patient's name and Log out.
- [ ] Content is a single column the width of a phone, centred on wider screens.
- [ ] The portal uses the kiosk's palette: a light grey page, content on white outlined panels, and Tamanu blue for actions. Controls are large enough to use by touch and sized for a phone.
- [ ] Every page other than the dashboard has a back link to the dashboard.
- [ ] Success messages span the width of a phone screen.
- [ ] Text uses the deployment's translations for its default language, so wording and names the deployment has changed appear in the portal as they do in Tamanu. Where a string has no translation, its English text shows.

## Dashboard

- [ ] The dashboard greets the patient by first name.
- [ ] To do comes first: one row per form the patient has been asked to fill in, naming the form and who sent it. Each row opens the form. With no forms outstanding, it says the patient is all up to date.
- [ ] Upcoming appointments follow, each showing the date at a glance, the day and time, and where known the appointment type, clinician, area and facility. With none, it says there are no upcoming appointments.
- [ ] Your health record comes last: Your details, Ongoing conditions, Allergies, Medications, Vaccinations and Procedures, each a row that expands in place to show its contents and collapses again, so the patient sees their whole record without leaving the dashboard. Each row says how many are recorded, or that none are; Your details says what it holds. Rows start collapsed, and any number can be open at once.

## Health record

- [ ] Ongoing conditions lists each condition with the date it was recorded.
- [ ] Allergies lists each allergy with its reaction, where recorded.
- [ ] Medications lists each ongoing medication with its dose, frequency and route, its start date, and the prescriber.
- [ ] Vaccinations shows the vaccine schedule, each with its dose, the week it is due and its status, and the recorded vaccines, each with its dose, date, who gave it and where.
- [ ] Procedures lists planned and completed procedures separately, each with its date and lead clinician.
- [ ] A list with nothing recorded says so.

## Forms

- [ ] A form fills the screen below the header, page by page, with the form's name, its page count and a progress bar at the top and Back and Next kept in view at the bottom. On a phone the form spans the screen edge to edge.
- [ ] Questions are the kiosk's question controls, in the same order and with the same answer formats as forms filled in by staff, so a response is the same wherever it was filled in.
- [ ] Next checks the page: a required question left unanswered, or an answer that fails its question's validation, is marked with a message and scrolled into view, and the patient stays on the page.
- [ ] Pages whose questions are all hidden by earlier answers are skipped, and only answers to questions the patient could see are submitted.
- [ ] Dates and times are entered in the time of the facility that sent the form, and stored as staff entries are.
- [ ] The last page's button is Submit. Submitting records the response, marks the form as completed, returns the patient to the dashboard and shows "Form submitted".
- [ ] Back on the first page returns to the dashboard.
- [ ] Leaving a form with answers entered and not submitted, by Back, the header or the browser's back button, shows the same "Discard changes?" prompt as editing details (see `patient-portal/patient-details.md`). Closing or reloading the tab triggers the browser's leave-page warning. A form left untouched is left without asking.
- [ ] A form that can't be opened says so, with a link back to the dashboard.
