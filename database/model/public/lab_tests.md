{% docs table__lab_tests %}
A single test as part of a [lab request](#!/source/source.tamanu.tamanu.lab_requests).
{% enddocs %}

{% docs lab_tests__result %}
The result of the test.
{% enddocs %}

{% docs lab_tests__lab_request_id %}
The [lab request](#!/source/source.tamanu.tamanu.lab_requests) this test is part of.
{% enddocs %}

{% docs lab_tests__lab_test_type_id %}
The [type](#!/source/source.tamanu.tamanu.lab_test_types) of the test.
{% enddocs %}

{% docs lab_tests__category_id %}
Reference to the category ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) of this test.
{% enddocs %}

{% docs lab_tests__lab_test_method_id %}
Reference to the method ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) of this test.
{% enddocs %}

{% docs lab_tests__laboratory_officer %}
Name of the lab officer performing the test.
{% enddocs %}

{% docs lab_tests__completed_date %}
Datetime at which the test was completed.
{% enddocs %}

{% docs lab_tests__verification %}
Free-form field for a verification indication.

May be a verifying or supervising officer's name, a department, lab notes...
{% enddocs %}

{% docs lab_tests__completed_date_legacy %}
[Deprecated] Timestamp at which the test was completed.
{% enddocs %}

{% docs lab_tests__reference_range_min %}
Custom reference range for this individual lab test, minimum value.
{% enddocs %}

{% docs lab_tests__reference_range_max %}
Custom reference range for this individual lab test, maximum value.
{% enddocs %}
