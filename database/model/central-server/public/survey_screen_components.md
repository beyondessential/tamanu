{% docs table__survey_screen_components %}
Describes how a survey question gets displayed.

See [program data element](#!/source/source.tamanu.tamanu.program_data_elements), which describes
how the data from the question is stored.
{% enddocs %}

{% docs survey_screen_components__screen_index %}
Screen this component should appear on.

Surveys can have multiple "screens" or pages, this index sets where this particular question sits.
{% enddocs %}

{% docs survey_screen_components__component_index %}
The absolute index (order) of the component in the survey.
{% enddocs %}

{% docs survey_screen_components__text %}
Description or question of this component.
{% enddocs %}

{% docs survey_screen_components__validation_criteria %}
JSON criteria that determines whether the value entered in this component is accepted.
{% enddocs %}

{% docs survey_screen_components__detail %}
Longer description or explanatory text of this component.
{% enddocs %}

{% docs survey_screen_components__config %}
JSON additional config of the component.
{% enddocs %}

{% docs survey_screen_components__options %}
JSON array of strings of options to be selected.
{% enddocs %}

{% docs survey_screen_components__visibility_criteria %}
JSON criteria that determines when this component is visible.

A criteria is a list of other components' codes and the value that will make this question show up:

```json
{
  "otherQuestion": "Yes"
}
```

There can also be the special criterium `{"hidden": true}` which always hides the question, and the
special key `"_conjunction": "or"` which makes it so _any one_ item in the list is sufficient to
show the question, instead of the default where _all_ items must match.
{% enddocs %}

{% docs survey_screen_components__calculation %}
Math expression to do calculations on the entered value before it's saved.

For example `questionCode + 3`.
{% enddocs %}

{% docs survey_screen_components__survey_id %}
The [survey](#!/source/source.tamanu.tamanu.surveys).
{% enddocs %}

{% docs survey_screen_components__data_element_id %}
Reference to the [data element](#!/source/source.tamanu.tamanu.program_data_elements) configuring
how the data from the question is stored.
{% enddocs %}
