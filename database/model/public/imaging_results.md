{% docs table__imaging_results %}
Result of an [imaging request](#!/source/source.tamanu.tamanu.imaging_requests).

In practice, there is usually one or two results per request:
- one containing a reference to a PACS image, when imaging integrations are enabled;
- one containing notes from a doctor who analysed the image.

However there is no limit; for example there may be multiple notes from multiple doctors.
{% enddocs %}

{% docs imaging_results__imaging_request_id %}
Reference to the [imaging request](#!/source/source.tamanu.tamanu.imaging_requests).
{% enddocs %}

{% docs imaging_results__completed_by_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who completed this imaging.
{% enddocs %}

{% docs imaging_results__description %}
Free-form description / notes about this imaging.
{% enddocs %}

{% docs imaging_results__external_code %}
External code for this result, used with PACS integration (generally via FHIR).
{% enddocs %}

{% docs imaging_results__completed_at %}
When this result was completed.
{% enddocs %}

{% docs imaging_results__result_image_url %}
Link to external imaging result viewer.
{% enddocs %}
