import express from 'express';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';

import { InvalidOperationError, InvalidParameterError } from '@tamanu/errors';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';

const FORM_BUILDER_CONTEXT = 'formBuilder';
const MAX_FILE_CONTEXT_LENGTH = 200_000;

export const formBuilderRouter = express.Router();

const normalizeAiMessageContent = content => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return JSON.stringify(part);
      })
      .join('\n');
  }
  return String(content ?? '');
};

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
      const response = await req.aiService.sendMessage(sessionId, userMessage);

      res.send({
        sessionId,
        message: normalizeAiMessageContent(response.content),
      });
    } finally {
      if (file && deleteFileAfterImport) {
        await fs.unlink(file).catch(() => {});
      }
    }
  }),
);
