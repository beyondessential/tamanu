import { QueryTypes } from 'sequelize';

import { CentralServerConnection } from '../sync';
import { fetchEncounterSummaryData } from './encounterSummaryData';

/**
 * Query logs.changes for ai_documents that were edited by a human for a given encounter.
 * Returns each non-empty human edit paired with the most recent prior AI-generated content.
 */
export async function getEncounterSummaryEditFeedback(encounterId, models, sequelize) {
  const doc = await models.AiDocument.findOne({
    where: {
      recordType: 'Encounter',
      recordId: encounterId,
      type: 'encounter_summary',
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
        ORDER BY ai.logged_at ASC
        LIMIT 1
      ) ai ON TRUE
      WHERE human.table_name = 'ai_documents'
      AND human.record_id = :recordId
      AND human.record_data->>'source' = 'human'
      AND human.record_data->>'status' = 'edited'
      AND NULLIF(human.record_data->>'content', '') IS NOT NULL
      AND ai.record_data->>'content' IS DISTINCT FROM human.record_data->>'content'
      ORDER BY human.logged_at ASC
      LIMIT 20
    `,
    { replacements: { recordId: doc.id }, type: QueryTypes.SELECT },
  );
}

export async function regenerateAiEncounterSummary({ encounterId, models, db, deviceId }) {
  const encounterData = await fetchEncounterSummaryData(encounterId, models);
  const editFeedback = await getEncounterSummaryEditFeedback(encounterId, models, db);

  const centralServer = new CentralServerConnection({ deviceId });
  // Disable the sync connection's default retry/backoff so an offline central fails
  // fast and surfaces an error in the UI, rather than retrying for ~90s while the
  // user stares at a spinner.
  const aiResponse = await centralServer.fetch('ai/encounter/summary', {
    method: 'POST',
    body: { encounterData, editFeedback },
    backoff: false,
  });

  const [doc] = await models.AiDocument.upsert({
    type: 'encounter_summary',
    recordType: 'Encounter',
    recordId: encounterId,
    content: aiResponse.content,
    status: 'generated',
    source: 'ai',
  });
  return doc;
}
