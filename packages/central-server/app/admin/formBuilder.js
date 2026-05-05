import express from 'express';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';

import { InvalidOperationError, InvalidParameterError } from '@tamanu/errors';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import { programDefinitionSchema } from './programImporter/programDefinition';

const FORM_BUILDER_CONTEXT = 'formBuilder';
const FORM_BUILDER_BUILD_CONTEXT = 'formBuilderBuildSurveyDefinition';
const MAX_FILE_CONTEXT_LENGTH = 200_000;

export const formBuilderRouter = express.Router();

const getFileContext = async file => {
  if (!file) return '';

  const content = await fs.readFile(file, 'utf8');
  const truncated = content.length > MAX_FILE_CONTEXT_LENGTH;
  const fileContent = truncated ? content.slice(0, MAX_FILE_CONTEXT_LENGTH) : content;
  const truncationNotice = truncated
    ? `\n\n[File content truncated to ${MAX_FILE_CONTEXT_LENGTH} characters]`
    : '';

  return `[TEXT DOCUMENT LOADED]\n${fileContent}${truncationNotice}`;
};

const buildUserMessage = ({ message, fileContext }) => {
  const trimmedMessage = message?.trim();
  const parts = [];

  if (fileContext) parts.push(fileContext);
  if (trimmedMessage) parts.push(trimmedMessage);

  if (parts.length === 0) {
    throw new InvalidParameterError('message or file is required');
  }

  return parts.join('\n\n');
};

formBuilderRouter.post(
  '/chat',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'FormBuilder');

    if (!req.aiService) {
      throw new InvalidOperationError('AI service is not enabled');
    }

    const { sessionId: existingSessionId, message, file, deleteFileAfterImport } = await getUploadedData(
      req,
    );

    try {
      const fileContext = await getFileContext(file);
      const userMessage = buildUserMessage({ message, fileContext });
      const sessionId =
        existingSessionId || (await req.aiService.createSession(FORM_BUILDER_CONTEXT));
      const response = await req.aiService.sendFormBuilderMessage(sessionId, userMessage);
      const programDefinition =
        response.ready_to_export || response.ready_to_generate
          ? await programDefinitionSchema.parseAsync(
              await req.aiService.invokeStructured(
                FORM_BUILDER_BUILD_CONTEXT,
                await req.aiService.getSessionTranscript(sessionId),
                programDefinitionSchema,
                { name: 'form_builder_program_definition' },
              ),
            )
          : null;

      res.send({
        sessionId,
        message: response.message,
        attachToProgramCode: response.attach_to_program_code,
        readyToExport: response.ready_to_export,
        readyToGenerate: response.ready_to_generate,
        programDefinition,
      });
    } finally {
      if (file && deleteFileAfterImport) {
        await fs.unlink(file).catch(() => {});
      }
    }
  }),
);
