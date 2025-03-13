## upcoming_vaccinations

A **view** which lists patients and next vaccine due for a given vaccine type.

The first dose of a vaccine type is based on weeks from birth due whilst subsequent doses are based on weeks from last 
vaccination due.

Age limits in years and thresholds in days for scheduled status are configurable with the following defaults:

- Age = 15
- Status: Scheduled = 28
- Status: Upcoming = 7
- Status: Due = -7
- Status: Overdue = -55
- Status: Missed = -Infinity

## patient_id

The `patient`.

## scheduled_vaccine_id

Reference to the `scheduled vaccine`.

## vaccine_category

Vaccine category [Routine, Catch-up, Campaign, Other]

## vaccine_id

Reference to the vaccine (`Reference Data`, `type = drug`).

## due_date

Due date of the scheduled vaccine.

## days_till_due

Number of days until the scheduled vaccine is due. Negative numbers indicates the number of days in the past the vaccine
was due.

## status

Status of the upcoming vaccination listed ['DUE', 'OVERDUE', 'MISSED', 'SCHEDULED', 'UPCOMING']

