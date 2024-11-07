{% docs table__lab_test_types %}
A kind of test that's possible to request.

This includes information about the test itself, and also parameters around result formatting, like
data type, expected ranges, etc.
{% enddocs %}

{% docs lab_test_types__code %}
Internal Tamanu code of the test.
{% enddocs %}

{% docs lab_test_types__name %}
Human-friendly name of the test.
{% enddocs %}

{% docs lab_test_types__unit %}
Unit the test result is measured in.
{% enddocs %}

{% docs lab_test_types__male_min %}
Minimum typical range for males.
{% enddocs %}

{% docs lab_test_types__male_max %}
Maximum typical range for males.
{% enddocs %}

{% docs lab_test_types__female_min %}
Minimum typical range for females.
{% enddocs %}

{% docs lab_test_types__female_max %}
Maximum typical range for females.
{% enddocs %}

{% docs lab_test_types__range_text %}
Unused.
{% enddocs %}

{% docs lab_test_types__result_type %}
Input type of result.

One of:
- `FreeText`
- `Number`
- `Select`
{% enddocs %}

{% docs lab_test_types__options %}
Comma-separated list of options. Unused.
{% enddocs %}

{% docs lab_test_types__lab_test_category_id %}
Reference to the category ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) of this test.
{% enddocs %}

{% docs lab_test_types__external_code %}
External code for the test (such as for LIMS).
{% enddocs %}
