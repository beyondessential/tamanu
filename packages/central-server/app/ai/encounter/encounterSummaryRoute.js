import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';

// Bound the accepted keys so a caller cannot send arbitrary text as prompt
// content; unknown top-level fields are rejected.
const encounterSummaryBodySchema = z
  .object({
    encounterData: z
      .object({
        patient: z.unknown(),
        allergies: z.array(z.unknown()).optional(),
        conditions: z.array(z.unknown()).optional(),
        encounter: z.unknown(),
        diagnoses: z.array(z.unknown()).optional(),
        procedures: z.array(z.unknown()).optional(),
        medications: z.array(z.unknown()).optional(),
        notes: z.array(z.unknown()).optional(),
        vitals: z.unknown().optional(),
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

export const encounterSummaryRoute = express.Router();

encounterSummaryRoute.use(ensurePermissionCheck);

encounterSummaryRoute.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Discharge');

    if (!req.aiService) {
      throw new ForbiddenError('AI service is not enabled or configured');
    }

    const { encounterData, editFeedback } = encounterSummaryBodySchema.parse(req.body);

    let userMessage = JSON.stringify(encounterData, null, 2);

    if (editFeedback.length > 0) {
      const feedbackSection = editFeedback
        .map(
          (f, i) =>
            `Correction ${i + 1}:\nOriginal AI output: ${f.aiGenerated}\nClinician corrected to: ${f.userEdited}`,
        )
        .join('\n\n');

      userMessage += `\n\n---\nPrevious summaries for this encounter were corrected by a clinician. Apply these corrections to your output:\n\n${feedbackSection}`;
    }

    const response = await req.aiService.invoke(AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY, userMessage);

    res.send({ content: response.content });
  }),
);
