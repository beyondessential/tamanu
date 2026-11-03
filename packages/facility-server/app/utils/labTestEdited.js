// The fields of a lab test that can change after first entry, mapped from the column captured in
// the audit log (logs.changes) to the key returned to the client. The single source of truth for
// which fields are tracked — both the per-field "edited" query (labs.js) and the patient results
// grid's result-cell flag (patientRelations.js) are built from the SQL helpers below.
export const EDITABLE_LAB_TEST_FIELDS = {
  result: 'result',
  secondary_result: 'secondaryResult',
  lab_test_method_id: 'labTestMethodId',
  laboratory_officer: 'laboratoryOfficer',
  verification: 'verification',
  completed_date: 'completedDate',
};

// A field counts as edited when it has taken more than one distinct non-empty value over its audit
// history — so first filling in a blank, or later clearing it, is not an edit. `column` is always a
// literal audit-column name from the map above, never query input.
export const labTestFieldEditedSql = column =>
  `COUNT(DISTINCT record_data->>'${column}')
     FILTER (WHERE NULLIF(TRIM(record_data->>'${column}'), '') IS NOT NULL) >= 2`;

// A changelog row is worth aggregating only if at least one tracked column holds a value; this
// prunes the blank rows before GROUP BY. Matches the union of the per-field FILTERs, so the edited
// flags are unchanged. Columns are literals from the map above, never query input.
export const labTestChangelogHasValueSql = (columns = Object.keys(EDITABLE_LAB_TEST_FIELDS)) =>
  columns
    .map(column => `NULLIF(TRIM(record_data->>'${column}'), '') IS NOT NULL`)
    .join('\n       OR ');
