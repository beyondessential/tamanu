## appointments

Table of appointments.

## id

Tamanu identifier for appointment.

## start_datetime

Start date and time of the appointment.

## end_datetime

End date and time of the appointment.

## start_time

When the appointment starts.

## end_time

When the appointment ends.

## patient_id

Reference to the `patient`.

## clinician_id

Reference to the `clinician` recording that appointment.

## location_id

The `location` where the appointment will take place.

## schedule_id

Reference to the `appointment schedule` in the case of repeating appointments.

## status

The current status of the appointment record.

One of:
- `Confirmed`
- `Arrived`
- `No-show`
- `Cancelled`

## type_legacy

The legacy type of appointment.

One of:
- `Standard`
- `Emergency`
- `Specialist`
- `Other`

## start_time_legacy

[Deprecated] Start time.

## end_time_legacy

[Deprecated] End time.

## location_group_id

The `location group` where the appointment will take place.

## booking_type_id

Reference to a `Reference Data (bookingType)`.

## appointment_type_id

Reference to a `Reference Data (appointmentType)`.

## is_high_priority

Boolean specify if the appointment is high priority.

## encounter_id

Reference to the `encounter` linked to this appointment

