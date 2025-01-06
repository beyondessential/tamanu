{% docs table__survey_responses %}
A response to a survey (as recorded by a practitioner).

Typically surveys are filled on behalf of patients as part of an encounter.

Because there are multiple distinct kinds of dates at play here:
- `created_at`, `updated_at`, `deleted_at` are system data for syncing and cannot be relied on for realtime
- `start_time`, `end_time` are real datetimes automatically recorded when starting and submitting a survey response
- in survey response answers, there could be a data element for targeting the date of when exactly the data is recorded in real time.
{% enddocs %}

{% docs survey_responses__start_time %}
When the survey was started.
{% enddocs %}

{% docs survey_responses__end_time %}
When the survey was completed.
{% enddocs %}

{% docs survey_responses__result %}
The numeric value that is the summary of the survey response.
{% enddocs %}

{% docs survey_responses__survey_id %}
The [survey](#!/source/source.tamanu.tamanu.surveys) being responded to.
{% enddocs %}

{% docs survey_responses__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this survey response is a part of.
{% enddocs %}

{% docs survey_responses__result_text %}
The textual value that is the summary of the survey response.
{% enddocs %}

{% docs survey_responses__user_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) recording this survey response.
{% enddocs %}

{% docs survey_responses__start_time_legacy %}
[Deprecated] When the survey was started.
{% enddocs %}

{% docs survey_responses__end_time_legacy %}
[Deprecated] When the survey was completed.
{% enddocs %}

{% docs survey_responses__notified %}
If the [survey](#!/source/source.tamanu.tamanu.surveys) is `notifiable`, whether this response's
notification has been sent.
{% enddocs %}

{% docs survey_responses__metadata %}
Metadata for a survey response, (eg: if a survey response is linked to another survey response)
{% enddocs %}
