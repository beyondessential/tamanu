## survey_responses

A response to a survey (as recorded by a practitioner).

Typically surveys are filled on behalf of patients as part of an encounter.

Because there are multiple distinct kinds of dates at play here:
- `created_at`, `updated_at`, `deleted_at` are system data for syncing and cannot be relied on for realtime
- `start_time`, `end_time` are real datetimes automatically recorded when starting and submitting a survey response
- in survey response answers, there could be a data element for targeting the date of when exactly the data is recorded in real time.

## start_time

When the survey was started.

## end_time

When the survey was completed.

## result

The numeric value that is the summary of the survey response.

## survey_id

The `survey` being responded to.

## encounter_id

Reference to the `encounter` this survey response is a part of.

## result_text

The textual value that is the summary of the survey response.

## user_id

Reference to the `user` recording this survey response.

## start_time_legacy

[Deprecated] When the survey was started.

## end_time_legacy

[Deprecated] When the survey was completed.

## notified

If the `survey` is `notifiable`, whether this response's
notification has been sent.

## metadata

Metadata for a survey response, (eg: if a survey response is linked to another survey response)

