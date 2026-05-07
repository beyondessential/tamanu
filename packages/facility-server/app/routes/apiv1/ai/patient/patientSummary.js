import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { NotFoundError } from '@tamanu/errors';
import { CentralServerConnection } from '../../../../sync';
import { fetchPatientSummaryData } from '../../../../services/patientSummaryData';

/**
 * Query logs.changes for ai_documents that were edited by a human for a given patient.
 * Returns pairs of { aiGenerated, userEdited } content so the AI can learn from corrections.
 */
async function getEditFeedback(patientId, sequelize) {
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

export const patientSummaryRoute = express.Router();

patientSummaryRoute.get(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    req.checkPermission('read', 'Patient');

    const { AiDocument } = req.models;
    const existing = await AiDocument.findOne({
      where: { recordType: 'Patient', recordId: patientId },
      order: [['createdAt', 'DESC']],
    });

    res.send({ aiDocument: existing?.forResponse() ?? null });
  }),
);

patientSummaryRoute.post(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { deviceId } = req;

    req.checkPermission('read', 'Patient');

    const { Patient, AiDocument } = req.models;
    const patientExists = await Patient.count({ where: { id: patientId } });
    if (!patientExists) {
      throw new NotFoundError(`Patient ${patientId} not found`);
    }

    const patientData = await fetchPatientSummaryData(patientId, req.models);
    const editFeedback = await getEditFeedback(patientId, req.db);

    const centralServer = new CentralServerConnection({ deviceId });
    const aiResponse = await centralServer.fetch('ai/patient/summary', {
      method: 'POST',
      body: { patientData, editFeedback },
      backoff: { maxAttempts: 3, maxWaitMs: 2000 },
    });

    const doc = await AiDocument.create({
      summaryType: 'patient',
      recordType: 'Patient',
      recordId: patientId,
      content: aiResponse.content,
    });

    res.send(doc.forResponse());
  }),
);

patientSummaryRoute.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');

    const { AiDocument } = req.models;
    const doc = await AiDocument.findByPk(req.params.id);
    if (!doc) {
      throw new NotFoundError('AI document not found');
    }

    const { content, status } = req.body;
    const updateFields = { source: 'human' };
    if (status === 'discarded') {
      updateFields.status = 'discarded';
      updateFields.content = null;
    } else {
      updateFields.status = 'edited';
      updateFields.content = content;
    }
    await doc.update(updateFields);

    res.send(doc.forResponse());
  }),
);
