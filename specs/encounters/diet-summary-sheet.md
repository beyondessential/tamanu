---
id: DIET
---

# Diet summary sheet

Applies to the diet summary sheet printed from Bed management: who it lists, how diets are counted per ward and across the facility, and how it is laid out for kitchen and ward staff.

## Printing the sheet

- A **Diet summary** button sits in the Bed management search bar beside Handover notes, and is available whether or not an Area is selected.
- Selecting it opens the sheet in a PDF preview modal with a print action.
- The sheet covers the facility the user is logged in to. With no Area applied in the search bar it covers every ward in that facility; with an Area applied it covers that ward alone.
- The other Bed management filters, such as bed status, don't narrow the sheet.
- The sheet is a snapshot of the facility at the moment it is opened, and the footer carries the print date and time.
- Printing it is available to anyone who can list patients and read encounters, locations and areas. No permission is specific to the sheet.

> [!NOTE]
> The permissions match the ones handover notes already needs, less the note permission, so a ward clerk who can print handover notes can print the diet summary without a role change.

## Who appears on the sheet

- Every patient with an open encounter at the facility appears, where the encounter is a hospital admission, a triage, an active ED care or an emergency short stay encounter.
- A patient's ward is the area of their encounter's location, and their bed is the location itself. Locations of any occupancy count.
- Patients whose location has no area are grouped under a **No area** section, which follows the named wards.
- Wards with no patients on the sheet are left off it.
- Patients are identified by name and NHN.
- A patient whose bed has been deleted does not appear on the sheet.
- A patient whose ward has been deleted appears under **No area** rather than dropping off the sheet.
- A patient in a bed whose visibility status is not current still appears, even where Bed management's own list hides that bed.

> [!NOTE]
> Emergency patients are fed from the same kitchen as admitted ones, so leaving them off the sheet would under-count meals. A diet is recorded on a hospital admission, so emergency patients are counted as regular meals until they are admitted.
>
> A deleted ward still feeds its patients because the sheet's job is to cover everyone with an open encounter, not to mirror Bed management's own ward list. A retired bed is kept for the same reason: the patient in it still needs feeding, whether or not the bed still shows on Bed management's own table.

## Layout

- The sheet is landscape A4, carrying the facility's certificate letterhead, the title "Diet summary sheet | {print date}", and a footer showing the print date and time and the page number out of the total.
- Page 1 opens with a **Hospital total** row beneath the diet column headers, carrying the counts for everyone on the sheet. It appears whether the sheet covers the whole facility or a single ward.
- Each ward follows as its own table, with Patient name, NHN and Bed columns, then a column per diet, and a tick where a patient is on that diet.
- A **Sub total** row sits at the top of each ward's table, carrying that ward's counts.
- Wards are ordered alphabetically, and the patients within a ward by bed in natural order, so Bed 2 precedes Bed 10.
- A ward whose table runs past a page break continues on the next page under "{Ward} (continued)", with the column headers repeated.
- The Hospital total row, the Sub total rows and the ward headings are set in bold, so they read apart from the patient rows.

> [!NOTE]
> The fonts the sheet is rendered with carry a regular and a bold face and nothing between, so bold is the only weight that sets these rows apart.
- Diet column headers are rotated to vertical, and zero counts are left blank.
- The diet columns share the width left over from the patient columns, and narrow as the number of diets grows, so the sheet is never more than one page wide.
- Where no patient matches, the sheet prints its letterhead, title and footer with a line reporting that there are no patients to show.
- The title, the column and total labels, and the empty-state line are translatable, and ward and diet names carry their reference data translations.

## Diet columns and counting

- The columns are the diets recorded against the patients on the sheet, so a diet nobody on the sheet is on takes up no width.
- The column for the diet configured as the regular meal comes first, under that diet's own name, and the remaining diets follow alphabetically.
- A patient with no diet recorded is counted under the regular meal column.
- A regular meal column appears whenever a patient on the sheet has no diet recorded, even where no patient has that diet recorded against them.
- A patient with several diets is ticked under each of them, and counted in each, so a ward's counts can come to more than the number of patients in it.
- A diet that is no longer offered for new records still takes its column where a patient on the sheet is on it.
- A ward's Sub total counts the patients in that ward under each diet, and the Hospital total is the sum of the ward sub totals.

## Configuration

- A setting names the diet that stands for a regular meal, chosen from the deployment's diet reference data. It is set deployment-wide, and a facility can override it with a diet of its own.
- Where no diet is named, the sheet carries its own **Regular** column, which holds the patients with no diet recorded.
- Where the diet configured as the regular meal no longer exists, its column still appears, under the generic **Regular** label.

> [!NOTE]
> Deployments name their regular meal differently, and several ship a diet of their own for it. Pointing the setting at that diet keeps the patients who have it recorded and the patients who have nothing recorded in one column, rather than splitting one kitchen order across two.
