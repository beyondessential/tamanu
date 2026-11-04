# Max appointments per area

## Design decisions

- **Facility-scoped setting.** Areas belong to a facility, so the limits are set at Facility scope and the area dropdown lists only that facility's areas.
- **Lives in the existing Appointments category** of the settings editor, as a top-level setting ("Max appointments per area") above Booking slots, so no new category or sub-category dropdown appears.
- **Limit is per area, per day.** It matches the calendar's per-day counts and the drawer's "for selected date" warning.
- **Optional per area.** Areas with no limit set aren't listed and have no limit; their calendar column shows the plain count ("7 appts").
- **Editor is area + max rows with a trailing empty row**, in place of the mapping editor's **Add** button. Filling in the empty row adds an area and a new empty row appears beneath it. Filled rows have a delete button; the empty row doesn't. The area dropdown leaves out areas already used in another row, so an area can't be limited twice. Unlike other settings rows, this one has no hover or focus highlight band, because the band filled the whole tall row.
- **Calendar count row** reads "7 of 7 appts" where a limit is set; the count turns alert red when the area is over its limit. With a limit set the unit is always plural ("1 of 5 appts"); without one it follows the count ("1 appt", "7 appts").
- **New appointment drawer** shows "Area has reached appointment limit for selected date" under Area and Date & time, in the same helper-text style as the existing same-day warning. It shows only when the new appointment would take the area over its limit (an area at 7 of 7 warns, because booking makes it 8). It is advisory: the booking can still be made, which is how an area reaches "5 of 4".
