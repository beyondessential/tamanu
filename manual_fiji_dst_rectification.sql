-- encounters
SELECT COUNT(*)
FROM encounters
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

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
SELECT COUNT(*)
FROM discharges
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

UPDATE discharges
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- note_pages
SELECT COUNT(*)
FROM note_pages
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

UPDATE note_pages
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date = date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- note_items
SELECT COUNT(*)
FROM note_items
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

UPDATE note_items
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date = date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- medications
SELECT COUNT(*)
FROM encounter_medications
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

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
SELECT COUNT(*)
FROM lab_requests
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

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
SELECT COUNT(*)
FROM lab_tests
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

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
SELECT COUNT(*)
FROM vitals
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

UPDATE vitals
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    date_recorded = date_recorded::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

-- imaging requests
SELECT COUNT(*)
FROM imaging_requests
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;

UPDATE imaging_requests
SET updated_at = updated_at - '1 hour'::interval,
    created_at = created_at - '1 hour'::interval,
    requested_date = requested_date::timestamp - '1 hour'::interval
WHERE updated_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      updated_at < '2022-11-14T07:30:00+12:00'::timestamptz AND
      created_at >= '2022-11-13T01:00:00+12:00'::timestamptz AND
      created_at < '2022-11-14T07:30:00+12:00'::timestamptz;
