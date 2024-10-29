{% docs table__imaging_requests %}
Imaging requests are the entrypoint of imaging workflows in Tamanu.

Each row is a request for radiology to perform one or more imagings on a patient.

Imagings can have one or more [request areas](#!/source/source.tamanu.tamanu.imaging_request_areas)
attached, and when completed will have [results](#!/source/source.tamanu.tamanu.imaging_results).
{% enddocs %}

{% docs imaging_requests__status %}
The status of the request.

One of:
- `pending`
- `in_progress`
- `completed`
- `cancelled`
- `deleted`
- `entered_in_error`
{% enddocs %}

{% docs imaging_requests__requested_date %}
When the imaging was requested.
{% enddocs %}

{% docs imaging_requests__encounter_id %}
Reference to the [encounter](#!/source/source.tamanu.tamanu.encounters) this imaging request is a part of.
{% enddocs %}

{% docs imaging_requests__requested_by_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who requested this imaging.
{% enddocs %}

{% docs imaging_requests__legacy_results %}
[Deprecated] Description of the results.

Since v1.24 this has moved to the [imaging results](#!/source/source.tamanu.tamanu.imaging_results) table.
{% enddocs %}

{% docs imaging_requests__completed_by_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who completed this imaging.
{% enddocs %}

{% docs imaging_requests__location_id %}
Reference to the [location](#!/source/source.tamanu.tamanu.locations) for this imaging request.
{% enddocs %}

{% docs imaging_requests__imaging_type %}
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
{% enddocs %}

{% docs imaging_requests__requested_date_legacy %}
[Deprecated] Timestamp when the imaging was requested.
{% enddocs %}

{% docs imaging_requests__priority %}
Priority of the request.

This is a customisable list; by default the values are `routine`, `urgent`, `asap`, `stat`.
{% enddocs %}

{% docs imaging_requests__location_group_id %}
Reference to the [location group](#!/source/source.tamanu.tamanu.location_groups) for this imaging request.
{% enddocs %}

{% docs imaging_requests__reason_for_cancellation %}
If the request is cancelled, why that is.

This is a customisable list; by default the values are `duplicate` and `entered-in-error`.

The 31-character limit was [arbitrary to avoid extremely long values set in error](https://github.com/beyondessential/tamanu/pull/3512/files#r1102169113).
{% enddocs %}

{% docs imaging_requests__display_id %}
Short unique identifier used on the frontend.
{% enddocs %}
