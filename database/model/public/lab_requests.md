{% docs table__lab_requests %}
Lab requests are the entrypoint of laboratory workflows in Tamanu.

Each row is a request for a laboratory to perform a group of tests on a sample taken from a patient.

It will be updated over the course of the workflow to various statuses, starting with
`reception_pending` (lab has not received the request yet), up to `published` (lab has completed the
tests and has attached verified results).

See also: `lab_request_attachments`, `lab_request_logs`, `lab_results`, `lab_tests`,
`lab_test_panels`, and related tables to those.
{% enddocs %}

{% docs lab_requests__sample_time %}
When the sample was collected.
{% enddocs %}

{% docs lab_requests__requested_date %}
When the request was submitted.
{% enddocs %}

{% docs lab_requests__urgent %}
Deprecated.
{% enddocs %}

{% docs lab_requests__specimen_attached %}
Whether a specimen is attached.

This implies `specimen_type_id`.
{% enddocs %}

{% docs lab_requests__status %}
The status of the request.

One of:
- `reception_pending`
- `results_pending`
- `interim_results`
- `to_be_verified`
- `verified`
- `published`
- `cancelled`
- `invalidated`
- `deleted`
- `sample-not-collected`
- `entered-in-error`
{% enddocs %}

{% docs lab_requests__senaite_id %}
When the [SENAITE](https://www.senaite.com/) integration is enabled, this is filled to the SENAITE
ID for the request.
{% enddocs %}

{% docs lab_requests__sample_id %}
When the [SENAITE](https://www.senaite.com/) integration is enabled, this is filled to the SENAITE
ID for the sample.
{% enddocs %}

{% docs lab_requests__requested_by_id %}
Reference to the [Clinician](#!/source/source.tamanu.tamanu.users) who submitted the request.
{% enddocs %}

{% docs lab_requests__encounter_id %}
Reference to the [Encounter](#!/source/source.tamanu.tamanu.encounters) the request is a part of.
{% enddocs %}

{% docs lab_requests__lab_test_category_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data) representing the
category of this request's test.
{% enddocs %}

{% docs lab_requests__display_id %}
Short unique identifier used on the frontend.
{% enddocs %}

{% docs lab_requests__lab_test_priority_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data) representing the
priority of this request.
{% enddocs %}

{% docs lab_requests__lab_test_laboratory_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data) representing the
laboratory fulfilling this request.
{% enddocs %}

{% docs lab_requests__sample_time_legacy %}
[Deprecated] When the sample was collected.
{% enddocs %}

{% docs lab_requests__requested_date_legacy %}
[Deprecated] When the request was submitted.
{% enddocs %}

{% docs lab_requests__reason_for_cancellation %}
Why this request was cancelled.

One of:
- `clinical`
- `duplicate`
- `entered-in-error`
- `other`
- `patient-discharged`
- `patient-refused`
{% enddocs %}

{% docs lab_requests__department_id %}
Reference to the [Department](#!/source/source.tamanu.tamanu.departments) the request comes from.
{% enddocs %}

{% docs lab_requests__lab_test_panel_request_id %}
Reference to the [Test Panel Request](#!/source/source.tamanu.tamanu.lab_test_panel_requests)
associated with this request, if any.
{% enddocs %}

{% docs lab_requests__lab_sample_site_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data) representing where
on the patient the sample was taken.
{% enddocs %}

{% docs lab_requests__published_date %}
When this lab request's results were published.
{% enddocs %}

{% docs lab_requests__specimen_type_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data) representing the
type of the specimen for the request, if specified.
{% enddocs %}

{% docs lab_requests__collected_by_id %}
Reference to the [Clinician](#!/source/source.tamanu.tamanu.users) who collected the sample.
{% enddocs %}

{% docs lab_requests__results_interpretation %}
Free-text interpretation and clinical commentary on the laboratory test results.
{% enddocs %}
