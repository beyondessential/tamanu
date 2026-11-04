---
id: APLIM
---

# Area appointment limits

A facility can set the most outpatient appointments each of its areas takes in a day. The outpatient appointments calendar shows each area's appointments against its limit, and staff booking an appointment are warned when it would take the area over. A limit is advisory: an appointment can always be booked, so an area can end up over its limit.

## Setting the limits

- [ ] Limits are a facility setting, Max appointments per area, in the Appointments category of the settings editor at Facility scope (see `administration/settings/overview.md`). Each facility sets limits for its own areas.
- [ ] The setting is a list of rows, each pairing an area, chosen from a dropdown of the facility's areas, with the maximum number of appointments that area takes in a day.
- [ ] An area with no row has no limit, so a facility limits only the areas it chooses to.
- [ ] The maximum is a whole number of at least one, entered in a number field with an up and down counter.
- [ ] The area dropdown offers only the areas not already chosen in another row, so an area has at most one limit.
- [ ] The list always ends with one empty row. Filling in either field of the empty row makes it part of the list, and a new empty row appears beneath it.
- [ ] Each row in the list has a delete button that removes it. The empty row has no delete button.
- [ ] The Area and Max appointments labels sit above the first row only.
- [ ] Saving a row that has an area but no maximum, or a maximum but no area, flags the missing field as required, and the settings aren't saved until it is filled in or the row is removed.
- [ ] Reset to default clears every limit.
- [ ] The setting's row keeps a plain background while hovered or while one of its fields has focus, so the highlight band other settings rows show doesn't fill its whole list.

## Counting an area's appointments

- [ ] An area's count for a day is the number of its outpatient appointments on that day, not counting cancelled appointments. No-shows count.
- [ ] A limit applies to each day separately.
- [ ] An area is over its limit when its count for the day is greater than its limit. An area whose count equals its limit has reached it but isn't over it.

## Calendar

- [ ] When the outpatient appointments calendar is grouped by area, each area's column shows its count for the selected day in the row beneath the area's name.
- [ ] Where the area has a limit, the count reads as the count of the limit, such as "7 of 7 appts". The unit is "appts" whatever the count, as in "1 of 5 appts".
- [ ] Where the area has no limit, the count reads alone, such as "7 appts", with the unit following the count: "1 appt" for one appointment and "appts" otherwise.
- [ ] The count and limit are emphasised and the unit is de-emphasised, so the numbers stand out.
- [ ] Where the area is over its limit, the count and limit are shown in the alert colour, such as "5 of 4 appts". An area that has reached its limit without going over is shown like any other.
- [ ] The count against a limit is the area's full count for the day, whatever type or patient filters the calendar has applied, so it always reflects the appointments the limit applies to.

## Warning when booking

- [ ] In the outpatient appointment drawer, once an area and a date and time are both chosen, the drawer warns when the appointment would take the area over its limit for that date: that is, when the area's count for that date has already reached or passed its limit.
- [ ] The warning applies both when booking a new appointment and when modifying one. When modifying, the appointment being modified isn't counted against the area and date chosen, so it warns only where the change would take the area over.
- [ ] For a repeating appointment, the warning checks the date in the Date & time field, the first in the series.
- [ ] The warning reads "Area has reached appointment limit for selected date" and appears beneath both the Area field and the Date & time field, in the same style as the drawer's warning that the patient already has an appointment that day.
- [ ] Where the Date & time field also has the same-day appointment warning, both warnings show beneath it.
- [ ] The warning follows the area and date chosen: changing either to an area without a limit, or to a date on which the area is under its limit, removes it.
- [ ] The warning is advisory. Confirming saves the appointment as usual, and the area's count on the calendar then shows it over its limit.
