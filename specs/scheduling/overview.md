---
id: SCHEDULING
---

# Scheduling

Appointments and location/resource bookings.

## Bookings that span more than one day

A location booking may run from one calendar day into another, an **overnight booking**. Whether a booking spans more than one day is judged by the calendar days its start and end fall on in the display timezone, so a booking is overnight exactly when the person reading it would see it cross midnight.

- [ ] A booking that spans more than one day belongs to each of the days it covers, from the day it starts to the day it ends, and appears in every one of those days' bookings.
- [ ] Wherever a booking's full range is shown against a particular day, a booking spanning more than one day carries at both ends the date that end falls on, including an end falling on the day being listed. Such a booking therefore reads as the same span on every day it covers, and is marked with an overnight indicator.
- [ ] Wherever a booking's full range is shown, a booking that starts and ends within the day it is listed against shows its two times without dates.
- [ ] A date shown alongside a time in a booking's range is a day and a month.
- [ ] A date and the time beside it read in the order they were composed, including in a locale written right to left, where neither is reordered against the other.

## Today's bookings on the dashboard

The dashboard lists the bookings a clinician has on the current day. It is a snapshot of that one day rather than a full statement of each booking's range, so it says only what the reader does not already know: the reader knows which day they are looking at, and each end of a booking's range is stated against that.

- [ ] Each end of a booking's range shows the time it falls at when it falls on the day being listed, and the date it falls on otherwise.
- [ ] A date at either end therefore tells the reader that the booking reaches beyond the day being listed, and each day a booking covers states the booking's span unambiguously.
- [ ] A booking with no end shows its start alone.
- [ ] A booking's range occupies a single line, wrapping only where the list is too narrow to hold it on one, and keeping its parts horizontally centred against each other where it wraps.
- [ ] Each booking is marked with an indicator of its status, and the bookings are threaded by a rail running from the first booking's indicator to the last's. A list of a single booking shows that booking's indicator alone.
