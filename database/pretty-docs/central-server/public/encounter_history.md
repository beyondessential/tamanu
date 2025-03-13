## encounter_history

Records changes to an encounter's basic details.

## encounter_id

Reference to the original `encounter` this history is for.

## department_id

Reference to the `department` the encounter was in.

## location_id

Reference to the `location` the encounter was in.

## examiner_id

Reference to the `examiner` for the encounter.

## encounter_type

The type of the encounter.

One of:
- `admission`
- `clinic`
- `imaging`
- `emergency`
- `observation`
- `triage`
- `surveyResponse`
- `vaccination`

## actor_id

`Who` made the change.

## change_type

The field which was changed.

One of:
- `encounter_type`
- `location`
- `department`
- `examiner`

