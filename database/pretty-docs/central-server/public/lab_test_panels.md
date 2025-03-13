## lab_test_panels

A panel is a collection of lab test types, usually standardised.

For example the BMP (basic metabolic panel) is a panel of 8 blood tests. Instead of ordering all 8
tests individually, a clinician can order the panel all at once. This may also used to more
efficiently use samples.

This table defines the available test panels, and
``lab_test_panel_lab_test_types``
contains the actual test types that are part of each panel. See
``lab_test_panel_requests`` for requesting
panels specifically, and ``lab_test_requests`` for
requesting lab tests in general.

## name

Name of the test panel.

## code

Internal Tamanu code of the panel.

## external_code

External code, such as for interfacing with LIMS.

## category_id

Reference to the category (`Reference Data`) of this test panel.

