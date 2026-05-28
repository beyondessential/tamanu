import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';

// The facility server authenticates to central with device credentials, not
// end-user credentials. Bounding the accepted keys limits what a caller can
// inject into the LLM prompt — unknown top-level fields are rejected.
const patientSummaryBodySchema = z
  .object({
    patientData: z
      .object({
        patient: z.unknown(),
        allergies: z.array(z.unknown()).optional(),
        conditions: z.array(z.unknown()).optional(),
        issues: z.array(z.unknown()).optional(),
        familyHistory: z.array(z.unknown()).optional(),
        carePlans: z.array(z.unknown()).optional(),
        activeEncounter: z.unknown(),
        pastEncounters: z.array(z.unknown()).optional(),
        vaccinations: z.array(z.unknown()).optional(),
        labRequests: z.array(z.unknown()).optional(),
        imagingRequests: z.array(z.unknown()).optional(),
      })
      .strict(),
    editFeedback: z
      .array(
        z.object({
          aiGenerated: z.string().nullish(),
          userEdited: z.string().nullish(),
        }),
      )
      .default([]),
  })
  .strict();

export const patientSummaryRoute = express.Router();

patientSummaryRoute.use(ensurePermissionCheck);

patientSummaryRoute.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientSummary');

    if (!req.aiService) {
      throw new ForbiddenError('AI service is not enabled or configured');
    }

    const { patientData, editFeedback } = patientSummaryBodySchema.parse(req.body);

    let userMessage = JSON.stringify(patientData, null, 2);

    if (editFeedback.length > 0) {
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
