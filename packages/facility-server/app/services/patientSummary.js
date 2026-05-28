import { QueryTypes } from 'sequelize';

import { CentralServerConnection } from '../sync';
import { fetchPatientSummaryData } from './patientSummaryData';

/**
 * Query logs.changes for ai_documents that were edited by a human for a given patient.
 * Returns each non-empty human edit paired with the most recent prior AI-generated content.
 */
export async function getPatientSummaryEditFeedback(patientId, models, sequelize) {
  const doc = await models.AiDocument.findOne({
    where: {
      recordType: 'Patient',
      recordId: patientId,
      type: 'patient_summary',
    },
  });

  if (!doc) return [];

  return sequelize.query(
    `
      SELECT
        ai.record_data->>'content' AS "aiGenerated",
        human.record_data->>'content' AS "userEdited"
      FROM logs.changes human
      JOIN LATERAL (
        SELECT record_data
        FROM logs.changes ai
        WHERE ai.table_name = 'ai_documents'
        AND ai.record_id = human.record_id
        AND ai.record_data->>'source' = 'ai'
        AND NULLIF(ai.record_data->>'content', '') IS NOT NULL
        AND ai.logged_at < human.logged_at
        ORDER BY ai.logged_at DESC
        LIMIT 1
      ) ai ON TRUE
      WHERE human.table_name = 'ai_documents'
      AND human.record_id = :recordId
      AND human.record_data->>'source' = 'human'
      AND human.record_data->>'status' = 'edited'
      AND NULLIF(human.record_data->>'content', '') IS NOT NULL
      AND ai.record_data->>'content' IS DISTINCT FROM human.record_data->>'content'
      ORDER BY human.logged_at DESC
    `,
    { replacements: { recordId: doc.id }, type: QueryTypes.SELECT },
  );
}

export async function regenerateAiPatientSummary({ patientId, models, db, deviceId }) {
  const patientData = await fetchPatientSummaryData(patientId, models);
  const editFeedback = await getPatientSummaryEditFeedback(patientId, models, db);

  const centralServer = new CentralServerConnection({ deviceId });
  const aiResponse = await centralServer.fetch('ai/patient/summary', {
    method: 'POST',
    body: { patientData, editFeedback },
  });

  // The composite primary key (type, record_type, record_id) makes this
  // upsert a no-op when a row already exists for this patient: existing summaries
  // (including edited or discarded ones) are reset to a fresh AI-generated state,
  // and concurrent regenerations across facilities converge on the same row.
  const [doc] = await models.AiDocument.upsert({
    type: 'patient_summary',
    recordType: 'Patient',
    recordId: patientId,
    content: aiResponse.content,
    status: 'generated',
    source: 'ai',
  });
  return doc;
}
