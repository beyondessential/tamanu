import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';

export const patientSummaryRoute = express.Router();

patientSummaryRoute.use(ensurePermissionCheck);

patientSummaryRoute.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');

    if (!req.aiService) {
      throw new ForbiddenError('AI service is not enabled or configured');
    }

    const { patientData, editFeedback } = req.body;

    let userMessage = JSON.stringify(patientData, null, 2);

    if (editFeedback?.length > 0) {
      const feedbackSection = editFeedback
        .map(
          (f, i) =>
            `Correction ${i + 1}:\nOriginal AI output: ${f.aiGenerated}\nClinician corrected to: ${f.userEdited}`,
        )
        .join('\n\n');

      userMessage += `\n\n---\nPrevious summaries for this patient were corrected by a clinician. Apply these corrections to your output:\n\n${feedbackSection}`;
    }

    const response = await req.aiService.invoke(AI_CONTEXT_NAMES.PATIENT_SUMMARY, userMessage);

    res.send({ content: response.content });
  }),
);
