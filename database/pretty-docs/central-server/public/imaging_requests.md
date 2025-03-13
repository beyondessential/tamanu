## imaging_requests

Imaging requests are the entrypoint of imaging workflows in Tamanu.

Each row is a request for radiology to perform one or more imagings on a patient.

Imagings can have one or more `request areas`
attached, and when completed will have `results`.

## status

The status of the request.

One of:
- `pending`
- `in_progress`
- `completed`
- `cancelled`
- `deleted`
- `entered_in_error`

## requested_date

When the imaging was requested.

## encounter_id

Reference to the `encounter` this imaging request is a part of.

## requested_by_id

Reference to the `user` who requested this imaging.

## legacy_results

[Deprecated] Description of the results.

Since v1.24 this has moved to the `imaging results` table.

## completed_by_id

Reference to the `user` who completed this imaging.

## location_id

Reference to the `location` for this imaging request.

## imaging_type

Type of imaging.

One of:
- `angiogram`
- `colonoscopy`
- `ctScan`
- `ecg`
- `echocardiogram`
- `endoscopy`
- `fluroscopy`
- `holterMonitor`
- `mammogram`
- `orthopantomography`
- `mri`
- `stressTest`
- `ultrasound`
- `vascularStudy`
- `xRay`

## requested_date_legacy

[Deprecated] Timestamp when the imaging was requested.

## priority

Priority of the request.

This is a customisable list; by default the values are `routine`, `urgent`, `asap`, `stat`.

## location_group_id

Reference to the `location group` for this imaging request.

## reason_for_cancellation

If the request is cancelled, why that is.

This is a customisable list; by default the values are `duplicate` and `entered-in-error`.

The 31-character limit was `arbitrary to avoid extremely long values set in error`.

## display_id

Short unique identifier used on the frontend.

