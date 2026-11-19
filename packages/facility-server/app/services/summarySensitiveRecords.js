import { literal } from 'sequelize';

// spec: AISUM
// AI summaries are shown to anyone who may read the summary, so they draw on no sensitive lab test
// or sensitive drug whatever the generating user's permissions. These are top-level `where`
// conditions for `LabRequest.findAll` and `Prescription.findAll`, referencing the root aliases.

// A lab request holding any sensitive test is sensitive as a whole, as in the lab request list.
export const LAB_REQUEST_WITHOUT_SENSITIVE_TESTS = literal(`NOT EXISTS (
  SELECT 1
  FROM lab_tests
  JOIN lab_test_types ON lab_test_types.id = lab_tests.lab_test_type_id
  WHERE lab_tests.lab_request_id = "LabRequest".id
    AND lab_test_types.is_sensitive IS TRUE
)`);

export const PRESCRIPTION_OF_NON_SENSITIVE_DRUG = literal(`NOT EXISTS (
  SELECT 1
  FROM reference_drugs
  WHERE reference_drugs.reference_data_id = "Prescription".medication_id
    AND reference_drugs.is_sensitive IS TRUE
)`);
