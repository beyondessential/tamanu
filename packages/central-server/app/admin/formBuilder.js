import express from 'express';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';
import { extname } from 'path';
import { nanoid } from 'nanoid';
import NodeCache from 'node-cache';
import { readFile, utils } from 'xlsx';
import { z } from 'zod';

import { InvalidOperationError, InvalidParameterError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import {
  programDefinitionSchema,
  sanitizeProgramDefinitionPreview,
} from './programImporter/programDefinition';

const FORM_BUILDER_CONTEXT = 'formBuilder';
const FORM_BUILDER_BUILD_CONTEXT = 'formBuilderBuildSurveyDefinition';
const FORM_BUILDER_TWEAK_CONTEXT = 'formBuilderTweakSurveyDefinition';
const MAX_FILE_CONTEXT_LENGTH = 200_000;
const TEXT_FILE_EXTENSIONS = new Set(['.txt', '.csv']);
const WORKBOOK_FILE_EXTENSIONS = new Set(['.xls', '.xlsx']);
const IMAGE_MEDIA_TYPES_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};
const IMAGE_CONTENT_TYPES = new Set(Object.values(IMAGE_MEDIA_TYPES_BY_EXTENSION));
const MAX_AI_FILENAME_LENGTH = 80;
const CHAT_JOB_TTL_SECONDS = 60 * 30;
const CHAT_JOB_STATUSES = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  FAILED: 'failed',
};

const chatJobs = new NodeCache({ stdTTL: CHAT_JOB_TTL_SECONDS, checkperiod: 60, useClones: false });

const partialSurveySchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    surveyType: z.string().trim().optional(),
    status: z.string().trim().optional(),
    isSensitive: z.boolean().optional(),
    notifiable: z.boolean().optional(),
    notifyEmailAddresses: z.array(z.string().trim()).optional(),
    visibilityCriteria: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    visibilityStatus: z.string().trim().optional(),
  })
  .passthrough();

const partialQuestionSchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    name: z.string().trim().optional(),
    text: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    options: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.string())]).optional(),
    newScreen: z.boolean().optional(),
    visibilityCriteria: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    validationCriteria: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    detail: z.string().optional(),
    config: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    calculation: z.string().optional(),
    visibilityStatus: z.string().trim().optional(),
    visualisationConfig: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  })
  .passthrough();

const formBuilderTweakResponseSchema = z.object({
  message: z.string().describe('A concise assistant message describing only the latest changes.'),
  operations: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('updateSurvey'),
          surveyName: z.string().trim().min(1),
          survey: partialSurveySchema,
        }),
        z.object({
          type: z.literal('replaceQuestion'),
          surveyName: z.string().trim().min(1),
          questionCode: z.string().trim().min(1),
          question: partialQuestionSchema,
        }),
        z.object({
          type: z.literal('addQuestionAfter'),
          surveyName: z.string().trim().min(1),
          questionCode: z.string().trim().min(1).nullable().optional(),
          question: partialQuestionSchema,
        }),
        z.object({
          type: z.literal('addQuestionBefore'),
          surveyName: z.string().trim().min(1),
          questionCode: z.string().trim().min(1).nullable().optional(),
          question: partialQuestionSchema,
        }),
        z.object({
          type: z.literal('removeQuestion'),
          surveyName: z.string().trim().min(1),
          questionCode: z.string().trim().min(1),
        }),
      ]),
    )
    .default([]),
});

const getImageMediaTypeFromBuffer = buffer => {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  return null;
};

const isPdfBuffer = buffer => buffer.subarray(0, 5).toString('ascii') === '%PDF-';

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

const sanitizeFileNameForPrompt = fileName => {
  if (!fileName) return undefined;

  const sanitized = fileName
    .split(/[\\/]/)
    .pop()
    .replace(/[^A-Za-z0-9._ -]/g, '')
    .trim()
    .slice(0, MAX_AI_FILENAME_LENGTH);

  return sanitized || undefined;
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

  const fileBuffer = await fs.readFile(file);

  if (extension === '.pdf' || contentType === 'application/pdf' || isPdfBuffer(fileBuffer)) {
    try {
      const interpretedPdf = await aiService.interpretFormBuilderPdf({
        pdfBase64: fileBuffer.toString('base64'),
        fileName: sanitizeFileNameForPrompt(fileName),
      });
      return `[PDF DOCUMENT INTERPRETED]\n${interpretedPdf}`;
    } catch (error) {
      log.warn({ error }, 'AI form builder failed to interpret uploaded PDF');
      return `[PDF DOCUMENT LOADED]\nUploaded PDF "${fileName || 'attachment'}". PDF interpretation failed. Do not stop to ask for another upload; make a best-effort draft from the filename and conversation, and mention that the PDF content could not be interpreted.`;
    }
  }

  const mediaType =
    (IMAGE_CONTENT_TYPES.has(contentType) ? contentType : null) ||
    IMAGE_MEDIA_TYPES_BY_EXTENSION[extension] ||
    getImageMediaTypeFromBuffer(fileBuffer);
  if (IMAGE_CONTENT_TYPES.has(mediaType)) {
    const interpretedImage = await aiService.interpretFormBuilderImage({
      imageBase64: fileBuffer.toString('base64'),
      mediaType,
      fileName: sanitizeFileNameForPrompt(fileName),
    });
    return `[FORM IMAGE INTERPRETED]\n${interpretedImage}`;
  }

  return `[TEXT DOCUMENT LOADED]\n${truncateFileContext(fileBuffer.toString('utf8'))}`;
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

const buildProgramDefinitionInput = async ({
  aiService,
  currentProgramDefinition,
  responseMessage,
  sessionId,
  userMessage,
}) => {
  if (!currentProgramDefinition) {
    return aiService.getSessionTranscript(sessionId);
  }

  return [
    '[CURRENT PROGRAM DEFINITION]',
    JSON.stringify(currentProgramDefinition),
    '[LATEST USER REQUEST]',
    userMessage,
    '[ASSISTANT RESPONSE]',
    responseMessage,
  ].join('\n\n');
};

const buildProgramDefinitionTweakInput = ({ currentProgramDefinition, userMessage }) =>
  [
    '[CURRENT PROGRAM DEFINITION]',
    JSON.stringify(currentProgramDefinition),
    '[LATEST USER REQUEST]',
    userMessage,
  ].join('\n\n');

const finaliseProgramDefinition = rawProgramDefinition =>
  programDefinitionSchema.parseAsync(sanitizeProgramDefinitionPreview(rawProgramDefinition));

const cloneProgramDefinition = programDefinition => JSON.parse(JSON.stringify(programDefinition));

const findSurveySheet = (programDefinition, surveyName) => {
  const surveySheet = programDefinition.surveySheets.find(sheet => sheet.surveyName === surveyName);
  if (!surveySheet) {
    throw new InvalidParameterError(`Survey sheet "${surveyName}" was not found`);
  }
  return surveySheet;
};

const findQuestionIndex = (surveySheet, questionCode) =>
  surveySheet.questions.findIndex(question => question.code === questionCode);

const insertQuestion = ({ surveySheet, questionCode, question, offset }) => {
  const referenceIndex = questionCode ? findQuestionIndex(surveySheet, questionCode) : -1;
  const insertIndex = referenceIndex === -1 ? surveySheet.questions.length : referenceIndex + offset;
  surveySheet.questions.splice(insertIndex, 0, question);
};

const applyProgramDefinitionTweak = async (currentProgramDefinition, tweakResponse) => {
  const programDefinition = cloneProgramDefinition(currentProgramDefinition);

  for (const operation of tweakResponse.operations) {
    if (operation.type === 'updateSurvey') {
      const survey = programDefinition.surveys.find(({ name }) => name === operation.surveyName);
      if (!survey) {
        throw new InvalidParameterError(`Survey "${operation.surveyName}" was not found`);
      }
      Object.assign(survey, operation.survey);
      continue;
    }

    const surveySheet = findSurveySheet(programDefinition, operation.surveyName);

    if (operation.type === 'replaceQuestion') {
      const questionIndex = findQuestionIndex(surveySheet, operation.questionCode);
      if (questionIndex === -1) {
        throw new InvalidParameterError(`Question "${operation.questionCode}" was not found`);
      }
      surveySheet.questions[questionIndex] = {
        ...surveySheet.questions[questionIndex],
        ...operation.question,
        code: operation.question.code || operation.questionCode,
      };
      continue;
    }

    if (operation.type === 'addQuestionAfter') {
      insertQuestion({
        surveySheet,
        questionCode: operation.questionCode,
        question: operation.question,
        offset: 1,
      });
      continue;
    }

    if (operation.type === 'addQuestionBefore') {
      insertQuestion({
        surveySheet,
        questionCode: operation.questionCode,
        question: operation.question,
        offset: 0,
      });
      continue;
    }

    if (operation.type === 'removeQuestion') {
      const questionIndex = findQuestionIndex(surveySheet, operation.questionCode);
      if (questionIndex === -1) {
        throw new InvalidParameterError(`Question "${operation.questionCode}" was not found`);
      }
      surveySheet.questions.splice(questionIndex, 1);
    }
  }

  return programDefinitionSchema.parseAsync(sanitizeProgramDefinitionPreview(programDefinition));
};

const serializeChatJobError = error => ({
  message: error?.message || 'AI form builder chat failed',
  detail: error?.detail,
  status: error?.status,
});

const processChatRequest = async ({
  aiService,
  sessionId: existingSessionId,
  message,
  file,
  fileName,
  fileContentType,
  programDefinition: currentProgramDefinition,
  deleteFileAfterImport,
}) => {
  try {
    const fileContext = await getFileContext({ aiService, file, fileName, fileContentType });
    const userMessage = buildUserMessage({ message, fileContext });
    const sessionId = existingSessionId || (await aiService.createSession(FORM_BUILDER_CONTEXT));

    if (currentProgramDefinition) {
      let tweakResponse;
      let programDefinition;
      try {
        tweakResponse = await aiService.invokeStructured(
          FORM_BUILDER_TWEAK_CONTEXT,
          buildProgramDefinitionTweakInput({ currentProgramDefinition, userMessage }),
          formBuilderTweakResponseSchema,
          { name: 'form_builder_tweak_response' },
        );
        programDefinition = await applyProgramDefinitionTweak(
          currentProgramDefinition,
          tweakResponse,
        );
      } catch (error) {
        log.warn({ error }, 'AI form builder tweak patch failed, falling back to full generation');
      }

      if (tweakResponse && programDefinition) {
        // History persistence should not discard a valid tweak result.
        await aiService.addSessionMessages(sessionId, {
          userMessage,
          assistantMessage: tweakResponse.message,
        }).catch(error => {
          log.warn({ error }, 'AI form builder failed to persist tweak chat history');
        });

        return {
          sessionId,
          message: tweakResponse.message,
          attachToProgramCode: null,
          programDefinition,
        };
      }
    }

    const response = await aiService.sendFormBuilderMessage(sessionId, userMessage);
    const isReady = response.ready;

    let programDefinition = null;
    if (isReady) {
      const buildInput = await buildProgramDefinitionInput({
        aiService,
        currentProgramDefinition,
        responseMessage: response.message,
        sessionId,
        userMessage,
      });
      programDefinition = await finaliseProgramDefinition(
        await aiService.invokeStructured(
          FORM_BUILDER_BUILD_CONTEXT,
          buildInput,
          programDefinitionSchema,
          { name: 'form_builder_program_definition' },
        ),
      );
    }

    return {
      sessionId,
      message: response.message,
      attachToProgramCode: response.attach_to_program_code,
      programDefinition,
    };
  } finally {
    if (file && deleteFileAfterImport) {
      await fs.unlink(file).catch(() => {});
    }
  }
};

const startChatJob = ({ aiService, userId, payload }) => {
  const jobId = nanoid();
  chatJobs.set(jobId, {
    id: jobId,
    userId,
    status: CHAT_JOB_STATUSES.PENDING,
  });

  processChatRequest({ aiService, ...payload })
    .then(result => {
      chatJobs.set(jobId, {
        id: jobId,
        userId,
        status: CHAT_JOB_STATUSES.COMPLETE,
        result,
      });
    })
    .catch(error => {
      log.warn({ error }, 'AI form builder async chat job failed');
      const serializedError = serializeChatJobError(error);
      chatJobs.set(jobId, {
        id: jobId,
        userId,
        status: CHAT_JOB_STATUSES.FAILED,
        error: serializedError,
      });
    });

  return jobId;
};

formBuilderRouter.post(
  '/chat',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'FormBuilder');

    if (!req.aiService) {
      throw new InvalidOperationError('AI service is not enabled');
    }

    const { async: runAsync, ...payload } = await getUploadedData(req);

    if (runAsync) {
      const jobId = startChatJob({
        aiService: req.aiService,
        userId: req.user.id,
        payload,
      });
      res.status(202).send({ jobId, status: CHAT_JOB_STATUSES.PENDING });
      return;
    }

    res.send(await processChatRequest({ aiService: req.aiService, ...payload }));
  }),
);

formBuilderRouter.get(
  '/chat/jobs/:jobId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'FormBuilder');

    const job = chatJobs.get(req.params.jobId);
    if (!job) {
      res.status(202).send({
        id: req.params.jobId,
        status: CHAT_JOB_STATUSES.PENDING,
      });
      return;
    }

    if (job.userId !== req.user.id) {
      throw new InvalidParameterError('AI form builder chat job was not found');
    }

    res.send(job);
  }),
);
