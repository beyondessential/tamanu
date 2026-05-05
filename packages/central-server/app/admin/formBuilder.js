import express from 'express';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';
import { extname } from 'path';
import { readFile, utils } from 'xlsx';

import { InvalidOperationError, InvalidParameterError } from '@tamanu/errors';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import { programDefinitionSchema } from './programImporter/programDefinition';

const FORM_BUILDER_CONTEXT = 'formBuilder';
const FORM_BUILDER_BUILD_CONTEXT = 'formBuilderBuildSurveyDefinition';
const MAX_FILE_CONTEXT_LENGTH = 200_000;
const TEXT_FILE_EXTENSIONS = new Set(['.txt', '.csv']);
const WORKBOOK_FILE_EXTENSIONS = new Set(['.xls', '.xlsx']);
const IMAGE_FILE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const IMAGE_MEDIA_TYPES_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};
const IMAGE_CONTENT_TYPES = new Set(Object.values(IMAGE_MEDIA_TYPES_BY_EXTENSION));

export const formBuilderRouter = express.Router();

const truncateFileContext = content => {
  const truncated = content.length > MAX_FILE_CONTEXT_LENGTH;
  const fileContent = truncated ? content.slice(0, MAX_FILE_CONTEXT_LENGTH) : content;
  const truncationNotice = truncated
    ? `\n\n[File content truncated to ${MAX_FILE_CONTEXT_LENGTH} characters]`
    : '';

  return `${fileContent}${truncationNotice}`;
};

const readWorkbookContext = file => {
  const workbook = readFile(file);
  return workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    return `[Sheet: ${sheetName}]\n${utils.sheet_to_csv(worksheet)}`;
  }).join('\n\n');
};

const getFileContext = async ({ aiService, file, fileName, fileContentType }) => {
  if (!file) return '';

  const extension = extname(fileName || '').toLowerCase();
  const contentType = fileContentType?.split(';')[0].trim().toLowerCase();
  if (WORKBOOK_FILE_EXTENSIONS.has(extension)) {
    return `[XLSX DOCUMENT LOADED]\n${truncateFileContext(readWorkbookContext(file))}`;
  }

  if (TEXT_FILE_EXTENSIONS.has(extension)) {
    const tag = extension === '.csv' ? 'CSV DOCUMENT LOADED' : 'TEXT DOCUMENT LOADED';
    return `[${tag}]\n${truncateFileContext(await fs.readFile(file, 'utf8'))}`;
  }

  if (extension === '.pdf' || contentType === 'application/pdf') {
    return `[PDF DOCUMENT LOADED]\nUploaded PDF "${fileName || 'attachment'}". Text extraction is not available yet; ask the implementer to confirm any details that are not already in the conversation.`;
  }

  if (IMAGE_FILE_EXTENSIONS.has(extension) || IMAGE_CONTENT_TYPES.has(contentType)) {
    const mediaType = contentType || IMAGE_MEDIA_TYPES_BY_EXTENSION[extension];
    const interpretedImage = await aiService.interpretFormBuilderImage({
      imageBase64: await fs.readFile(file, 'base64'),
      mediaType,
      fileName,
    });
    return `[FORM IMAGE INTERPRETED]\n${interpretedImage}`;
  }

  return `[TEXT DOCUMENT LOADED]\n${truncateFileContext(await fs.readFile(file, 'utf8'))}`;
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

    const {
      sessionId: existingSessionId,
      message,
      file,
      fileName,
      fileContentType,
      deleteFileAfterImport,
    } = await getUploadedData(req);

    try {
      const fileContext = await getFileContext({
        aiService: req.aiService,
        file,
        fileName,
        fileContentType,
      });
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
