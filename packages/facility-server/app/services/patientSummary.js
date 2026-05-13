import { QueryTypes } from 'sequelize';

import { CentralServerConnection } from '../sync';
import { fetchPatientSummaryData } from './patientSummaryData';

/**
 * Query logs.changes for ai_documents that were edited by a human for a given patient.
 * Returns pairs of { aiGenerated, userEdited } content so the AI can learn from corrections.
 */
export async function getPatientSummaryEditFeedback(patientId, sequelize) {
  // Find ai_documents for this patient that were edited (source = 'human', status = 'edited')
  // Then look up the change log to find the original AI-generated content before the edit
  const editedDocs = await sequelize.query(
    `SELECT id, content FROM ai_documents
     WHERE record_type = 'Patient' AND record_id = :patientId
     AND status = 'edited' AND source = 'human'
     ORDER BY updated_at DESC
     LIMIT 5`,
    { replacements: { patientId }, type: QueryTypes.SELECT },
  );

  if (editedDocs.length === 0) return [];

  const feedback = [];
  for (const doc of editedDocs) {
    // Get the earliest change log entry for this record (the original AI-generated version)
    const [originalLog] = await sequelize.query(
      `SELECT record_data->>'content' AS content FROM logs.changes
       WHERE table_name = 'ai_documents' AND record_id = :recordId
       AND (record_data->>'source') = 'ai'
       ORDER BY logged_at ASC
       LIMIT 1`,
      { replacements: { recordId: doc.id }, type: QueryTypes.SELECT },
    );

    if (originalLog?.content && doc.content && originalLog.content !== doc.content) {
      feedback.push({
        aiGenerated: originalLog.content,
        userEdited: doc.content,
      });
    }
  }

  return feedback;
}

export async function regenerateAiPatientSummary({ patientId, models, db, deviceId }) {
  const patientData = await fetchPatientSummaryData(patientId, models);
  const editFeedback = await getPatientSummaryEditFeedback(patientId, db);

  const centralServer = new CentralServerConnection({ deviceId });
  const aiResponse = await centralServer.fetch('ai/patient/summary', {
    method: 'POST',
    body: { patientData, editFeedback },
  });

  return models.AiDocument.create({
    summaryType: 'patient',
    recordType: 'Patient',
    recordId: patientId,
    content: aiResponse.content,
  });
}
