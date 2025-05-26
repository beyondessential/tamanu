{% docs table__program_data_elements %}
Describes how a survey question gets stored.

See [survey screen components](#!/source/source.tamanu.tamanu.survey_screen_components), which
describes how the question is displayed.
{% enddocs %}

{% docs program_data_elements__code %}
Machine-friendly short name for the question.

This is also used to refer to questions within criteria and such.
{% enddocs %}

{% docs program_data_elements__name %}
Human-friendly name
{% enddocs %}

{% docs program_data_elements__indicator %}
Another name for the data element.

It's named `indicator` from mimicry of Tupaia.
{% enddocs %}

{% docs program_data_elements__default_text %}
Default value.
{% enddocs %}

{% docs program_data_elements__default_options %}
Default options if this is a dropdown.
{% enddocs %}

{% docs program_data_elements__type %}
Type of the field.

Types are here: <https://github.com/beyondessential/tamanu/blob/main/packages/constants/src/surveys.ts>
{% enddocs %}

{% docs program_data_elements__visualisation_config %}
JSON visualisation configuration.
{% enddocs %}
