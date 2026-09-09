import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';

import { buildSummaryUserMessage } from '../summaryUserMessage';

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

    // Per-request content stays in the human turn so the system prompt can cache.
    const userMessage = buildSummaryUserMessage({
      dataTag: 'encounter_data',
      data: encounterData,
      editFeedback,
    });

    const response = await req.aiService.invoke(AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY, userMessage);

    res.send({ content: response.content });
  }),
);
