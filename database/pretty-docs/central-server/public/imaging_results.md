## imaging_results

Result of an `imaging request`.

In practice, there is usually one or two results per request:
- one containing a reference to a PACS image, when imaging integrations are enabled;
- one containing notes from a doctor who analysed the image.

However there is no limit; for example there may be multiple notes from multiple doctors.

## imaging_request_id

Reference to the `imaging request`.

## completed_by_id

Reference to the `user` who completed this imaging.

## description

Free-form description / notes about this imaging.

## external_code

External code for this result, used with PACS integration (generally via FHIR).

## completed_at

When this result was completed.

## result_image_url

Link to external imaging result viewer.

