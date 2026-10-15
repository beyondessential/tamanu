---
id: RDISCH
---

# Recently discharged patients

A listing, under the Facility admin section of the sidebar, of patients discharged from the current facility within the past 24 hours. It lets staff find and follow up a recently discharged patient without already knowing who they are, showing where and by whom each patient was discharged.

## Which discharges are listed

A discharge is an encounter at the current facility whose end date has been set. Encounters are grouped by patient status, as elsewhere in Tamanu: Inpatient (Hospital admission), Outpatient (Clinic, Imaging), and Emergency (Triage, Active ED care, Emergency short stay). Form response and Vaccination record encounters carry no patient status, since they close as soon as they are created.

- [ ] An encounter is listed when its location belongs to the current facility, its end date falls within the past 24 hours, and its encounter type carries a patient status.
- [ ] Discharges made automatically by the system, such as outpatient encounters closed overnight or encounters closed on a patient's death, are listed like any other discharge.
- [ ] A patient with more than one discharge in the window appears once, for their most recent discharge.
- [ ] Deceased patients are listed, with their row highlighted in the same way as on other patient listings.

## Table

- [ ] The view is titled "Recently discharged patients".
- [ ] The table columns are, in order: Patient ID, First name, Last name, DOB, Sex, Encounter type, Department, Clinician, Discharge date.
- [ ] Encounter type shows the discharged encounter's patient status: Inpatient, Outpatient, or Emergency.
- [ ] Department shows the department the encounter was assigned to when it was discharged.
- [ ] Clinician shows the clinician recorded as discharging the encounter, and is blank when the discharge recorded no clinician.
- [ ] Discharge date shows the date of the encounter's end date, and hovering over it shows both the date and time.
- [ ] Rows are ordered by discharge date and time, most recent first, until the user picks another sort.
- [ ] Every column except Patient ID is sortable. Sorting by Encounter type groups rows by patient status.
- [ ] Clicking a row opens that patient's summary page.
- [ ] When no patients match, the table shows "No patients found".

## Search

- [ ] The search bar shows Patient ID, First name, Last name, and Encounter type, in that order, with Department and Discharging clinician, in that order, under advanced search.
- [ ] Patient ID, First name, and Last name match any part of the value, ignoring case.
- [ ] Encounter type offers Inpatient, Outpatient, and Emergency, and matches the discharged encounter's patient status.
- [ ] Department matches the department the encounter was assigned to when it was discharged, and suggests departments from the current facility.
- [ ] Discharging clinician matches the clinician recorded as discharging the encounter.
- [ ] Search narrows the listed rows: a patient appears only when their most recent discharge in the window matches. An earlier discharge in the same window is not considered.
- [ ] Search parameters are retained when the user leaves the view and returns to it, until the app is reloaded.

## Permissions

- [ ] Viewing the listed patients requires permission to list patients. A user without it sees the table's no-permission message, and searching is disabled.

## Configuration

- [ ] By default, "Recently discharged patients" sits under Facility admin in the sidebar, directly above "System errors".
- [ ] The item is part of the facility sidebar layout settings in the admin panel, alongside the other Facility admin items. It is visible by default, and a deployment can hide it or change its sort priority.
