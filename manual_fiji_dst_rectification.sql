SELECT COUNT(*) AS encounters_count
FROM encounters
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS discharges_count
FROM discharges
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS note_pages_count
FROM note_pages
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS note_items_count
FROM note_items
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS encounter_medications_count
FROM encounter_medications
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS lab_requests_count
FROM lab_requests
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS lab_tests_count
FROM lab_tests
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS vitals_count
FROM vitals
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

SELECT COUNT(*) AS imaging_requests_count
FROM imaging_requests
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- encounters
UPDATE encounters
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    start_date = start_date::timestamp - '1 hour'::interval,
    end_date = end_date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- discharges
UPDATE discharges
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- note_pages
UPDATE note_pages
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date = date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- note_items
UPDATE note_items
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date = date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- medications
UPDATE encounter_medications
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date = date::timestamp - '1 hour'::interval,
    end_date = end_date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- lab requests
UPDATE lab_requests
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    sample_time = sample_time::timestamp - '1 hour'::interval,
    requested_date = requested_date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- lab tests
UPDATE lab_tests
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date = date::timestamp - '1 hour'::interval,
    completed_date = completed_date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- vitals
UPDATE vitals
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date_recorded = date_recorded::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- imaging requests
UPDATE imaging_requests
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    requested_date = requested_date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;
