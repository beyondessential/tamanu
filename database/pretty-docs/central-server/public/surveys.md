## surveys

Surveys, aka custom forms that can be filled by practitioners.

These are composed of `screen components`.

## code

Machine-friendly code.

## name

Human-friendly name.

## program_id

The `program` grouping this survey.

## survey_type

Type of survey.

One of:
- `programs`
- `referral`
- `obsolete`
- `vitals`

## is_sensitive

Whether the data recorded in the survey is sensitive.

## notifiable

Whether filling this survey sends a notification email.

These are sent by the `SurveyCompletionNotifierProcessor` scheduled task.

## notify_email_addresses

If `notifiable` is true, where to send the notification.

