{% docs table__surveys %}
Surveys, aka custom forms that can be filled by practitioners.

These are composed of [screen components](#!/source/source.tamanu.tamanu.survey_screen_components).
{% enddocs %}

{% docs surveys__code %}
Machine-friendly code.
{% enddocs %}

{% docs surveys__name %}
Human-friendly name.
{% enddocs %}

{% docs surveys__program_id %}
The [program](#!/source/source.tamanu.tamanu.programs) grouping this survey.
{% enddocs %}

{% docs surveys__survey_type %}
Type of survey.

One of:
- `programs`
- `referral`
- `obsolete`
- `vitals`
{% enddocs %}

{% docs surveys__is_sensitive %}
Whether the data recorded in the survey is sensitive.
{% enddocs %}

{% docs surveys__notifiable %}
Whether filling this survey sends a notification email.

These are sent by the `SurveyCompletionNotifierProcessor` scheduled task.
{% enddocs %}

{% docs surveys__notify_email_addresses %}
If `notifiable` is true, where to send the notification.
{% enddocs %}
