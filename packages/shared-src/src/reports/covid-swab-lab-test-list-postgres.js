const query = `
SELECT
  patients.first_name AS "firstName",
  patients.last_name AS "lastName",
  patients.date_of_birth AS "dob",
  patients.sex AS "sex",
  patients.display_id AS "patientId",
  -- TODO: 3 RDT columns go here
  latest_lab_tests.display_id AS "labRequestId",
  latest_lab_tests.category_name AS "labRequestType",
  (
    UPPER(SUBSTRING(latest_lab_tests.status::text, 1, 1)) ||
    REPLACE(SUBSTRING(latest_lab_tests.status::text, 2), '_', ' ')
  ) AS "status",
  latest_lab_tests.result AS "result",
  requested_by_display_name AS "requestedBy",
  latest_lab_tests.date AS "requestedDate",
  priority_name AS "priority",
  laboratory_name AS "testingLaboratory",
  latest_lab_tests.completed_date AS "testingDate"
  -- TODO: 29 survey response answers go here
  
FROM patients

-- join latest COVID lab test for a patient
LEFT JOIN LATERAL (
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
    laboratory.name AS laboratory_name

  FROM lab_requests

  LEFT JOIN lab_tests
    ON lab_tests.lab_request_id = lab_requests.id
  INNER JOIN encounters
    ON 
      encounters.id = lab_requests.encounter_id 
      AND encounters.patient_id = patients.id
  LEFT JOIN users requested_by_users
    ON requested_by_users.id = lab_requests.requested_by_id
  LEFT JOIN reference_data category
    ON category.id = lab_requests.lab_test_category_id
  LEFT JOIN reference_data priority
    ON priority.id = lab_requests.lab_test_priority_id
  LEFT JOIN reference_data laboratory
    ON laboratory.id = lab_requests.lab_test_laboratory_id

  -- TODO: join with any covid surveys within +/- 5 days of the lab request

  ORDER BY lab_tests.date DESC
  LIMIT 1    
) latest_lab_tests ON true

-- TODO: include survey response (conditional on whether patient had lab request)

`;

export async function dataGenerator(models, parameters) {
  // TODO
}

export const permission = 'LabTest';
