{% docs table__lab_test_panels %}
A panel is a collection of lab test types, usually standardised.

For example the BMP (basic metabolic panel) is a panel of 8 blood tests. Instead of ordering all 8
tests individually, a clinician can order the panel all at once. This may also used to more
efficiently use samples.

This table defines the available test panels, and
[`lab_test_panel_lab_test_types`](#!/source/source.tamanu.tamanu.lab_test_panel_lab_test_types)
contains the actual test types that are part of each panel. See
[`lab_test_panel_requests`](#!/source/source.tamanu.tamanu.lab_test_panel_requests) for requesting
panels specifically, and [`lab_test_requests`](#!/source/source.tamanu.tamanu.lab_test_requests) for
requesting lab tests in general.
{% enddocs %}

{% docs lab_test_panels__name %}
Name of the test panel.
{% enddocs %}

{% docs lab_test_panels__code %}
Internal Tamanu code of the panel.
{% enddocs %}

{% docs lab_test_panels__external_code %}
External code, such as for interfacing with LIMS.
{% enddocs %}

{% docs lab_test_panels__category_id %}
Reference to the category ([Reference Data](#!/source/source.tamanu.tamanu.reference_data)) of this test panel.
{% enddocs %}
