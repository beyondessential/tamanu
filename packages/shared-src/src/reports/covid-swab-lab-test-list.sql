WITH
  lab_requests_by_date AS (
    SELECT 
      lab_tests.id,
      lab_tests.date,
      lab_tests.completed_date,
      lab_tests.status,
      lab_tests.result,
      lab_requests.display_id,
      category.name AS category_name,
      requested_by_users.display_name AS requested_by_display_name,
      priority.name AS priority_name,
      laboratory.name AS laboratory_name,
      method.name AS method_name,
      encounters.patient_id AS patient_id
  
    FROM lab_requests
  
    LEFT JOIN lab_tests
      ON lab_tests.lab_request_id = lab_requests.id
    INNER JOIN encounters
      ON encounters.id = lab_requests.encounter_id 
    LEFT JOIN users requested_by_users
      ON requested_by_users.id = lab_requests.requested_by_id
    LEFT JOIN reference_data category
      ON category.id = lab_requests.lab_test_category_id
    LEFT JOIN reference_data priority
      ON priority.id = lab_requests.lab_test_priority_id
    LEFT JOIN reference_data laboratory
      ON laboratory.id = lab_requests.lab_test_laboratory_id
    LEFT JOIN reference_data method
      ON method.id = lab_tests.lab_test_method_id
    -- TODO: join with any covid surveys within +/- 5 days of the lab request
  
    WHERE lab_requests.status != 'deleted'
    AND category.id = 'labTestCategory-COVID'
  
    ORDER BY lab_tests.date DESC
  ),

  covid_survey_responses AS (
    SELECT
      survey_responses.id,
      end_time,
      encounters.patient_id AS patient_id

    FROM survey_responses
  
    INNER JOIN encounters
      ON survey_responses.encounter_id = encounters.id

    WHERE survey_id = 'program-fijicovid19-fijicovidsampcollection'
    -- TODO: parameters (village)
  ),

  lab_requests_with_survey_responses AS (
    SELECT *
    FROM (
      SELECT
        lab_requests_by_date.*,
        covid_survey_responses.id AS response_id,
        covid_survey_responses.end_time AS response_end_time,
        lab_requests_by_date.id AS lab_request_id,
        lab_requests_by_date.date AS request_date,
        -- this horrible thing is a window expression to get the next lab request
        lead(lab_requests_by_date.date, 1) OVER (
          PARTITION BY lab_requests_by_date.patient_id
        ) AS next_request_date
      FROM covid_survey_responses
      INNER JOIN lab_requests_by_date
        ON covid_survey_responses.patient_id = lab_requests_by_date.patient_id
    ) q
    WHERE q.response_end_time >= q.request_date
      AND q.response_end_time < q.next_request_date    
  )

SELECT
  patients.first_name AS "firstName",
  patients.last_name AS "lastName",
  patients.date_of_birth AS "dob",
  patients.sex AS "sex",
  patients.display_id AS "patientId",
  lab_requests_with_survey_responses.display_id AS "labRequestId",
  lab_requests_with_survey_responses.category_name AS "labRequestType",
  lab_requests_with_survey_responses.method_name AS "labRequestMethod",
  (
    UPPER(SUBSTRING(lab_requests_with_survey_responses.status::text, 1, 1)) ||
    REPLACE(SUBSTRING(lab_requests_with_survey_responses.status::text, 2), '_', ' ')
  ) AS "status",
  lab_requests_with_survey_responses.result AS "result",
  requested_by_display_name AS "requestedBy",
  lab_requests_with_survey_responses.date AS "requestedDate",
  priority_name AS "priority",
  laboratory_name AS "testingLaboratory",
  lab_requests_with_survey_responses.completed_date AS "testingDate",
  (
    SELECT body
    FROM survey_response_answers sra
    INNER JOIN lab_requests_with_survey_responses lrwsr
      ON lrwsr.response_id = sra.response_id
    WHERE data_element_id = 'pde-FijCOVSamp11' -- contactPhone
    LIMIT 1
  ) AS "contactPhone" -- TODO: this doesn't actually work yet
  -- TODO: about 29 survey response answers go here
  
FROM patients

-- join latest COVID lab test for a patient
LEFT JOIN lab_requests_with_survey_responses
  ON lab_requests_with_survey_responses.patient_id = patients.id

-- TODO: parameters

-- exclude test user
WHERE patients.id NOT IN(
  '4d719b6f-af55-42ac-99b3-5a27cadaab2b', -- Palau
  '2d574680-e0fc-4956-a37e-121ccb434995', -- Fiji
  'cebdd9a4-2744-4ad2-9919-98dc0b15464c'  -- Dev - for testing purposes
)

ORDER BY patients.id -- TODO: this is for testing only
;
