{% docs table__survey_response_answers %}
A single answer as part of a [survey response](#!/source/source.tamanu.tamanu.survey_responses).
{% enddocs %}

{% docs survey_response_answers__name %}
Name of the question.
{% enddocs %}

{% docs survey_response_answers__body %}
Value of the answer.
{% enddocs %}

{% docs survey_response_answers__response_id %}
The [survey response](#!/source/source.tamanu.tamanu.survey_responses).
{% enddocs %}

{% docs survey_response_answers__data_element_id %}
Reference to the [question](#!/source/source.tamanu.tamanu.program_data_elements).
{% enddocs %}

{% docs survey_response_answers__body_legacy %}
[Deprecated] Value of the answer in old format.
{% enddocs %}

{% docs survey_response_answers__edited_time %}
The last time this answer was edited by a user (via `PATCH /surveyResponse` request).
`NULL` if and only if this this is the initial answer submitted as part of the original survey
response.

Not to be confused with `survey_response_answers.updated_at`, which is database-level record
metadata.
{% enddocs %}
