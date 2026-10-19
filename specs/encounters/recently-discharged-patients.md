---
id: RDISCH
---

# Recently discharged patients

A listing, under the Facility admin section of the sidebar, of patients discharged from the current facility within the past 24 hours. It lets staff find and follow up a recently discharged patient without already knowing who they are, showing where and by whom each patient was discharged.

## Which discharges are listed

A discharge is an encounter at the current facility whose end date has been set. Encounters are grouped by patient status, matching the Status column of the All patients listing: Inpatient (Hospital admission), Outpatient (Clinic, Imaging), and Emergency (Triage, Active ED care, Emergency short stay). Form response and Vaccination record encounters carry no patient status, since they close as soon as they are created.

- [ ] An encounter is listed when its location belongs to the current facility, its end date is no more than 24 hours ago, and its encounter type carries a patient status.
- [ ] A discharge dated in the future is listed, so that a mistaken discharge date can be noticed and corrected.
- [ ] Discharges made automatically by the system, such as outpatient encounters closed overnight or encounters closed on a patient's death, are listed like any other discharge.
- [ ] A patient with more than one discharge in the window appears once, for their most recent discharge that matches the search.
- [ ] Deceased patients are listed, with their whole row shown in red.

## Table

- [ ] The view is titled "Recently discharged patients".
- [ ] The table columns are, in order: Patient ID, First name, Last name, DOB, Sex, Encounter type, Department, Clinician, Discharge date.
- [ ] Encounter type shows the discharged encounter's patient status: Inpatient, Outpatient, or Emergency.
- [ ] Department shows the department the encounter was assigned to when it was discharged.
- [ ] Clinician shows the clinician recorded as discharging the encounter, or "N/A" when the system discharged it without recording a clinician.
- [ ] Discharge date shows the date of the encounter's end date, and hovering over it shows both the date and time.
- [ ] Rows are ordered by discharge date and time, most recent first, until the user picks another sort.
- [ ] Every column except Patient ID is sortable, with text sorted ignoring case. Sorting by Encounter type groups rows by patient status.
- [ ] Clicking a row opens that patient's summary page.
- [ ] When no patients match, the table shows "No patients found".

## Search

- [ ] The search bar shows Patient ID, First name, Last name, and Encounter type, in that order, with Department and Discharging clinician, in that order, under advanced search.
- [ ] Patient ID, First name, and Last name match any part of the value, ignoring case.
- [ ] Encounter type offers Inpatient, Outpatient, and Emergency, and matches the discharged encounter's patient status.
- [ ] Department matches the department the encounter was assigned to when it was discharged, and suggests departments from the current facility.
- [ ] Discharging clinician matches the clinician recorded as discharging the encounter.
- [ ] Search applies to every discharge in the window before each patient's most recent one is picked. A patient whose most recent discharge doesn't match is listed for their most recent earlier discharge in the window that does.
- [ ] Search parameters are retained when the user leaves the view and returns to it, until the app is reloaded.

## Permissions

- [ ] Viewing the listed patients requires permission to list patients. A user without it sees the table's no-permission message, and searching is disabled.

## Configuration

- [ ] By default, "Recently discharged patients" sits under Facility admin in the sidebar, directly above "System errors".
- [ ] The item is part of the facility sidebar layout settings in the admin panel, alongside the other Facility admin items. It is visible by default, and a deployment can hide it or change its sort priority.
