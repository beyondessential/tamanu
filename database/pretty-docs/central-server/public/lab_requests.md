## lab_requests

Lab requests are the entrypoint of laboratory workflows in Tamanu.

Each row is a request for a laboratory to perform a group of tests on a sample taken from a patient.

It will be updated over the course of the workflow to various statuses, starting with
`reception_pending` (lab has not received the request yet), up to `published` (lab has completed the
tests and has attached verified results).

See also: `lab_request_attachments`, `lab_request_logs`, `lab_results`, `lab_tests`,
`lab_test_panels`, and related tables to those.

## sample_time

When the sample was collected.

## requested_date

When the request was submitted.

## urgent

Deprecated.

## specimen_attached

Whether a specimen is attached.

This implies `specimen_type_id`.

## status

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

## senaite_id

When the `SENAITE` integration is enabled, this is filled to the SENAITE
ID for the request.

## sample_id

When the `SENAITE` integration is enabled, this is filled to the SENAITE
ID for the sample.

## requested_by_id

Reference to the `Clinician` who submitted the request.

## encounter_id

Reference to the `Encounter` the request is a part of.

## lab_test_category_id

Reference to the `Reference Data` representing the
category of this request's test.

## display_id

Short unique identifier used on the frontend.

## lab_test_priority_id

Reference to the `Reference Data` representing the
priority of this request.

## lab_test_laboratory_id

Reference to the `Reference Data` representing the
laboratory fulfilling this request.

## sample_time_legacy

[Deprecated] When the sample was collected.

## requested_date_legacy

[Deprecated] When the request was submitted.

## reason_for_cancellation

Why this request was cancelled.

One of:
- `duplicate`
- `entered-in-error`

## department_id

Reference to the `Department` the request comes from.

## lab_test_panel_request_id

Reference to the `Test Panel Request`
associated with this request, if any.

## lab_sample_site_id

Reference to the `Reference Data` representing where
on the patient the sample was taken.

## published_date

When this lab request's results were published.

## specimen_type_id

Reference to the `Reference Data` representing the
type of the specimen for the request, if specified.

## collected_by_id

Reference to the `Clinician` who collected the sample.

