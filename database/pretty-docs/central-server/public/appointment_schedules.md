## appointment_schedules

Defines recurrence rules for appointments.

## until_date

The end date for the recurrence. No occurrences will be generated beyond this date. 
Both `until_date` and `occurrence_count` cannot be null at the same time to ensure the recurrence has an end condition.

## interval

The recurrence interval. For example:
- For a `frequency` of `WEEKLY`, an `interval` of 1 means "Once a week."
- For a `frequency` of `MONTHLY`, an `interval` of 3 means "Every 3 months."

## frequency

How often the the recurrence occurs.

One of:
- `WEEKLY`
- `MONTHLY`

## days_of_week

Stores an array of ISO weekday abbreviations. 
Given `WEEKLY` frequency `days_of_week` determines the weekday that the repeated appointment occurs on. 
Given `MONTHLY` frequency `days_of_week` is combined with `nth_weekday` to determine the date in each month that the repeated appointment occurs on.

One of: 
- `MO`
- `TU`
- `WE`
- `TH`
- `FR`
- `SA`
- `SU`

## nth_weekday

Ordinal weekday for monthly recurrence interpreted with `days_of_week` for example:
- `1` with `days_of_week = ['MO']` =  First Monday of the month
- `2` with `days_of_week = ['TU']` =  Second Tuesday of the month
- `-1` with `days_of_week = ['FR']` = Last Friday of the month

## occurrence_count

When this value is set, the recurrence ends after generating the specified number of occurrences
At least one of `occurrence_count` or `until_date` must be set.

## is_fully_generated

Whether or not all repeating appointments have been created for a schedule

## generated_until_date

The date of the most recent appointment in a schedule, this is set after generation of the repeated appointment and then updated if it is necessary to generate further appointments.

## cancelled_at_date

The date from which appointments in a schedule have been cancelled, this is set when cancelling 'this and all future appointments'.

