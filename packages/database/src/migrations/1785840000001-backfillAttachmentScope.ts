import { QueryInterface } from 'sequelize';

// spec: ATCH
// Existing attachments were created without their owner's linkage, so their scope
// is recovered from the records that reference them: uploaded documents and
// patient letters through document_metadata, lab report PDFs through
// lab_request_attachments, and survey photo answers through the answer whose body
// holds the attachment id. An attachment no record references keeps null scope and
// stays central-only.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    WITH owners AS (
      SELECT
        dm.attachment_id,
        COALESCE(dm.patient_id, e.patient_id) AS patient_id,
        dm.encounter_id
      FROM document_metadata dm
      LEFT JOIN encounters e ON e.id = dm.encounter_id
      WHERE dm.attachment_id IS NOT NULL

      UNION ALL

      SELECT lra.attachment_id, e.patient_id, lr.encounter_id
      FROM lab_request_attachments lra
      JOIN lab_requests lr ON lr.id = lra.lab_request_id
      JOIN encounters e ON e.id = lr.encounter_id

      UNION ALL

      SELECT sra.body, e.patient_id, sr.encounter_id
      FROM survey_response_answers sra
      JOIN survey_responses sr ON sr.id = sra.response_id
      JOIN encounters e ON e.id = sr.encounter_id
      JOIN program_data_elements pde ON pde.id = sra.data_element_id
      WHERE pde.type = 'Photo' AND sra.body IS NOT NULL AND sra.body <> ''
    ),
    -- An attachment referenced more than once resolves to a single owner so the
    -- update is deterministic; distinct owners for one attachment do not occur,
    -- since each upload creates its own row.
    resolved AS (
      SELECT DISTINCT ON (attachment_id) attachment_id, patient_id, encounter_id
      FROM owners
      WHERE patient_id IS NOT NULL OR encounter_id IS NOT NULL
      ORDER BY attachment_id, patient_id NULLS LAST, encounter_id NULLS LAST
    )
    UPDATE attachments a
    SET patient_id = resolved.patient_id,
        encounter_id = resolved.encounter_id
    FROM resolved
    WHERE a.id = resolved.attachment_id
      AND a.patient_id IS NULL
      AND a.encounter_id IS NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: scope written at creation is indistinguishable from scope
  // recovered by this backfill, so rolling back clears both.
  await query.sequelize.query(`
    UPDATE attachments SET patient_id = NULL, encounter_id = NULL;
  `);
}
