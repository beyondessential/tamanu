import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';

import { buildSummaryUserMessage } from '../summaryUserMessage';

// The facility server authenticates to central with device credentials, not
// end-user credentials. Bounding the accepted keys limits what a caller can
// inject into the LLM prompt — unknown top-level fields are rejected.
const patientSummaryBodySchema = z
  .object({
    patientData: z
      .object({
        patient: z.unknown(),
        death: z.unknown().optional(),
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
        medications: z.array(z.unknown()).optional(),
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
    req.checkPermission('write', 'PatientSummary');

    if (!req.aiService) {
      throw new ForbiddenError('AI service is not enabled or configured');
    }

    const { patientData, editFeedback } = patientSummaryBodySchema.parse(req.body);

    // Per-request content stays in the human turn so the system prompt can cache.
    const userMessage = buildSummaryUserMessage({
      dataTag: 'patient_data',
      data: patientData,
      editFeedback,
    });


    const response = await req.aiService.invoke(AI_CONTEXT_NAMES.PATIENT_SUMMARY, userMessage);

    res.send({ content: response.content });
  }),
);
