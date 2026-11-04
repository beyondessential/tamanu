# Max appointments per area

## Design decisions

- **Facility-scoped setting.** Areas belong to a facility, so the limits are set at Facility scope and the area dropdown lists only that facility's areas.
- **Lives in the existing Appointments category** of the settings editor, as a top-level setting ("Max appointments per area") above Booking slots, so no new category or sub-category dropdown appears.
- **Limit is per area, per day.** It matches the calendar's per-day counts and the drawer's "for selected date" warning.
- **Optional per area.** Areas with no limit set aren't listed and have no limit; their calendar column shows the plain count ("7 appts").
- **Editor is area + max rows with a trailing empty row**, in place of the mapping editor's **Add** button. Filling in the empty row adds an area and a new empty row appears beneath it. Filled rows have a delete button; the empty row doesn't.
- **Calendar count row** reads "7 of 7 appts" where a limit is set; the count turns alert red when the area is over its limit.
- **New appointment drawer** shows "Area has reached appointment limit for selected date" under Area and Date & time, in the same helper-text style as the existing same-day warning. It shows only when the new appointment would take the area over its limit (an area at 7 of 7 warns, because booking makes it 8). It is advisory: the booking can still be made, which is how an area reaches "5 of 4".

## Open questions

- With a limit set and one booking, should the count read "1 of 5 appt" or "1 of 5 appts"?
