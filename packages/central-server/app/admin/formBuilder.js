import express from 'express';
import asyncHandler from 'express-async-handler';
import { promises as fs } from 'fs';
import { extname } from 'path';
import { nanoid } from 'nanoid';
import { Op } from 'sequelize';
import { readFile, utils } from 'xlsx';
import { z } from 'zod';

import { AI_CONTEXT_NAMES } from '@tamanu/constants';
import { InvalidOperationError, InvalidParameterError, NotFoundError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import {
  programDefinitionSchema,
  sanitizeProgramDefinitionPreview,
} from './programImporter/programDefinition';

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

// Async chat jobs are persisted (FormBuilderChatJob) rather than held in memory,
// so the result is visible to every central process and survives a restart — a
// polling client always resolves the job that started its request. Expired rows
// are purged by FormBuilderChatCleaner.
const jobExpiry = () => new Date(Date.now() + CHAT_JOB_TTL_SECONDS * 1000);

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

const cellToString = value => (value == null ? '' : String(value).trim());

const parseBooleanCell = value => {
  const normalised = cellToString(value).toLowerCase();
  return normalised === 'true' || normalised === 'yes';
};

const rowToRecord = (header, row) =>
  Object.fromEntries(header.map((key, index) => [key, row[index]]));

const buildSurveyMetadataFromRow = record => {
  const survey = {
    code: cellToString(record.code),
    name: cellToString(record.name),
  };
  const surveyType = cellToString(record.surveyType);
  if (surveyType) survey.surveyType = surveyType;
  const status = cellToString(record.status);
  if (status) survey.status = status;
  if (cellToString(record.isSensitive)) survey.isSensitive = parseBooleanCell(record.isSensitive);
  if (cellToString(record.notifiable)) survey.notifiable = parseBooleanCell(record.notifiable);
  const notifyEmailAddresses = cellToString(record.notifyEmailAddresses)
    .split(',')
    .map(email => email.trim())
    .filter(Boolean);
  if (notifyEmailAddresses.length) survey.notifyEmailAddresses = notifyEmailAddresses;
  const visibilityCriteria = cellToString(record.visibilityCriteria);
  if (visibilityCriteria) survey.visibilityCriteria = visibilityCriteria;
  const visibilityStatus = cellToString(record.visibilityStatus);
  if (visibilityStatus) survey.visibilityStatus = visibilityStatus;
  return survey;
};

const QUESTION_STRING_FIELDS = [
  'options',
  'visibilityCriteria',
  'validationCriteria',
  'detail',
  'config',
  'calculation',
  'visibilityStatus',
  'visualisationConfig',
];

const buildQuestionFromRow = record => {
  const code = cellToString(record.code);
  const name = cellToString(record.name);
  const text = cellToString(record.text);
  // The schema requires non-empty name and text. Real exports populate both,
  // but fall back to neighbours so a single blank cell doesn't reject an
  // otherwise valid form (saving is additive, so this never overwrites data).
  const question = {
    code,
    type: cellToString(record.type),
    name: name || text || code,
    text: text || name || code,
  };
  if (parseBooleanCell(record.newScreen)) question.newScreen = true;
  for (const field of QUESTION_STRING_FIELDS) {
    const value = cellToString(record[field]);
    if (value) question[field] = value;
  }
  return question;
};

const findSurveySheetForCode = (workbook, surveyCode) => {
  if (workbook.Sheets[surveyCode]) return workbook.Sheets[surveyCode];
  // Sheet names are capped at 31 characters on write, so a longer survey code
  // is truncated — match on that prefix as a fallback.
  const truncated = surveyCode.slice(0, 31);
  return workbook.Sheets[truncated] ?? null;
};

// Deterministically parse a Tamanu program export workbook (a Metadata sheet
// plus one sheet per survey) into the ProgramDefinition shape. Returns null
// when the file isn't a recognisable program export, so the caller can fall
// back to the LLM flow.
const parseProgramExportWorkbook = file => {
  const workbook = readFile(file);
  const metadataSheet = workbook.Sheets.Metadata;
  if (!metadataSheet) return null;

  const metadataRows = utils.sheet_to_json(metadataSheet, { header: 1, blankrows: false });
  const surveyHeaderIndex = metadataRows.findIndex(
    row => row[0] === 'code' && row.includes('surveyType'),
  );
  if (surveyHeaderIndex === -1) return null;

  const metadata = {};
  for (let index = 0; index < surveyHeaderIndex; index += 1) {
    const [key, value] = metadataRows[index];
    if (typeof key === 'string' && key) metadata[key] = cellToString(value);
  }

  const surveyHeader = metadataRows[surveyHeaderIndex];
  const surveyMetadata = metadataRows
    .slice(surveyHeaderIndex + 1)
    .filter(row => cellToString(row[0]))
    .map(row => buildSurveyMetadataFromRow(rowToRecord(surveyHeader, row)));
  if (!surveyMetadata.length) return null;

  // Exports can include obsolete surveys whose sheets are empty. Skip any
  // survey without questions rather than aborting — saving is additive, so
  // dropping an empty survey from the working definition is non-destructive and
  // keeps `surveys`/`surveySheets` consistent for schema validation.
  const surveys = [];
  const surveySheets = [];
  for (const survey of surveyMetadata) {
    const sheet = findSurveySheetForCode(workbook, survey.code);
    if (!sheet) continue;
    const rows = utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    if (rows.length < 2) continue;
    const [questionHeader, ...questionRows] = rows;
    const questions = questionRows
      .filter(row => cellToString(row[0]))
      .map(row => buildQuestionFromRow(rowToRecord(questionHeader, row)));
    if (!questions.length) continue;
    surveys.push(survey);
    surveySheets.push({ surveyName: survey.name, questions });
  }
  if (!surveys.length) return null;

  return {
    title: metadata.programName || metadata.programCode || 'Program',
    ...(metadata.programCode ? { programCode: metadata.programCode } : {}),
    ...(metadata.programName ? { programName: metadata.programName } : {}),
    surveys,
    surveySheets,
  };
};

// Parse and validate an uploaded program export into a working definition, or
// return null when the file can't be read as one.
const loadProgramDefinitionFromUpload = async ({ file, fileName }) => {
  if (!file) return null;
  if (!WORKBOOK_FILE_EXTENSIONS.has(extname(fileName || '').toLowerCase())) return null;
  try {
    const rawProgramDefinition = parseProgramExportWorkbook(file);
    if (!rawProgramDefinition) return null;
    return await finaliseProgramDefinition(rawProgramDefinition);
  } catch (error) {
    log.warn({ error }, 'AI form builder could not parse uploaded file as a program export');
    return null;
  }
};

const buildProgramLoadedMessage = programDefinition => {
  const surveyCount = programDefinition.surveys.length;
  const programName = programDefinition.programName || programDefinition.title;
  return `I've loaded "${programName}" from your file — it has ${surveyCount} survey${
    surveyCount === 1 ? '' : 's'
  }. Tell me which questions you'd like to add, remove, or change.`;
};

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
  message: error?.message ?? 'AI form builder chat failed',
  detail: error?.detail,
  status: error?.status,
});

const invokeProgramDefinitionBuild = (aiService, buildInput) =>
  aiService.invokeStructured(
    AI_CONTEXT_NAMES.FORM_BUILDER_BUILD,
    buildInput,
    programDefinitionSchema,
    { name: 'form_builder_program_definition' },
  );

// The model sometimes returns a partial definition (most often omitting the
// surveySheets array), which fails structured-output validation. We retry once
// with explicit corrective guidance, and on persistent failure surface a clean,
// actionable message — never the raw LangChain parser exception.
const BUILD_RETRY_GUIDANCE =
  'Your previous response was rejected because it did not match the required structure (commonly a missing "surveySheets" array). Return the COMPLETE ProgramDefinition as JSON with BOTH a "surveys" array of metadata AND a "surveySheets" array containing every survey and all of its questions. Do not omit or summarise any questions.';

const generateProgramDefinition = async ({
  aiService,
  currentProgramDefinition,
  response,
  sessionId,
  userMessage,
}) => {
  const buildInput = await buildProgramDefinitionInput({
    aiService,
    currentProgramDefinition,
    responseMessage: response.message,
    sessionId,
    userMessage,
  });

  try {
    return await finaliseProgramDefinition(await invokeProgramDefinitionBuild(aiService, buildInput));
  } catch (error) {
    log.warn(
      { error },
      'AI form builder build failed to parse, retrying once with corrective guidance',
    );
    try {
      return await finaliseProgramDefinition(
        await invokeProgramDefinitionBuild(aiService, `${buildInput}\n\n[IMPORTANT] ${BUILD_RETRY_GUIDANCE}`),
      );
    } catch (retryError) {
      log.warn({ error: retryError }, 'AI form builder build retry failed');
      throw new InvalidOperationError(
        'The form builder could not generate a complete form for this request. Please try again, or make a smaller change at a time.',
      );
    }
  }
};

// Attempt a targeted patch against the current program definition. Returns the
// tweak result on success, or null when the LLM produced operations that don't
// apply to the current definition (e.g. references a non-existent survey or
// question) — the caller falls back to a full regeneration. Anything else
// (network, auth, unexpected) propagates so the user gets a real error.
const tryTweakProgramDefinition = async ({ aiService, currentProgramDefinition, userMessage }) => {
  let tweakResponse;
  try {
    tweakResponse = await aiService.invokeStructured(
      AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK,
      buildProgramDefinitionTweakInput({ currentProgramDefinition, userMessage }),
      formBuilderTweakResponseSchema,
      { name: 'form_builder_tweak_response' },
    );
  } catch (error) {
    log.warn({ error }, 'AI form builder tweak structured output failed, falling back to full generation');
    return null;
  }

  try {
    const programDefinition = await applyProgramDefinitionTweak(
      currentProgramDefinition,
      tweakResponse,
    );
    return { message: tweakResponse.message, programDefinition };
  } catch (error) {
    if (error instanceof InvalidParameterError || error instanceof z.ZodError) {
      log.warn({ error }, 'AI form builder tweak patch did not apply, falling back to full generation');
      return null;
    }
    throw error;
  }
};

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
    // Fall back to a fresh session if the client's sessionId is stale (e.g. it
    // expired, or referred to a session that no longer exists).
    const sessionId =
      existingSessionId && (await aiService.hasSession(existingSessionId))
        ? existingSessionId
        : await aiService.createSession(AI_CONTEXT_NAMES.FORM_BUILDER);

    // An uploaded Tamanu program export is parsed deterministically into a
    // working definition. This seeds the targeted tweak path for subsequent
    // edits instead of regenerating the entire (often huge) program from
    // scratch — which the model can't reliably do in one structured response.
    if (!currentProgramDefinition) {
      const uploadedDefinition = await loadProgramDefinitionFromUpload({ file, fileName });
      if (uploadedDefinition) {
        const editRequest = message?.trim();
        // If the user described an edit alongside the upload, apply it now.
        if (editRequest) {
          const tweakResult = await tryTweakProgramDefinition({
            aiService,
            currentProgramDefinition: uploadedDefinition,
            userMessage: editRequest,
          });
          if (tweakResult) {
            await aiService
              .addSessionMessages(sessionId, {
                userMessage,
                assistantMessage: tweakResult.message,
              })
              .catch(error => {
                log.warn({ error }, 'AI form builder failed to persist upload-edit chat history');
              });
            return {
              sessionId,
              message: tweakResult.message,
              attachToProgramCode: null,
              programDefinition: tweakResult.programDefinition,
            };
          }
        }

        const loadedMessage = buildProgramLoadedMessage(uploadedDefinition);
        await aiService
          .addSessionMessages(sessionId, { userMessage, assistantMessage: loadedMessage })
          .catch(error => {
            log.warn({ error }, 'AI form builder failed to persist uploaded program chat history');
          });
        return {
          sessionId,
          message: loadedMessage,
          attachToProgramCode: null,
          programDefinition: uploadedDefinition,
        };
      }
    }

    if (currentProgramDefinition) {
      const tweakResult = await tryTweakProgramDefinition({
        aiService,
        currentProgramDefinition,
        userMessage,
      });

      if (tweakResult) {
        // History persistence should not discard a valid tweak result.
        await aiService.addSessionMessages(sessionId, {
          userMessage,
          assistantMessage: tweakResult.message,
        }).catch(error => {
          log.warn({ error }, 'AI form builder failed to persist tweak chat history');
        });

        return {
          sessionId,
          message: tweakResult.message,
          attachToProgramCode: null,
          programDefinition: tweakResult.programDefinition,
        };
      }
    }

    const response = await aiService.sendFormBuilderMessage(sessionId, userMessage);
    const programDefinition = response.ready
      ? await generateProgramDefinition({
          aiService,
          currentProgramDefinition,
          response,
          sessionId,
          userMessage,
        })
      : null;

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

const startChatJob = async ({ aiService, models, userId, payload }) => {
  const { FormBuilderChatJob } = models;
  const jobId = nanoid();
  // Insert the pending row before returning the jobId, so a client that polls
  // immediately always finds its job.
  await FormBuilderChatJob.create({
    id: jobId,
    userId,
    status: CHAT_JOB_STATUSES.PENDING,
    expiresAt: jobExpiry(),
  });

  processChatRequest({ aiService, ...payload })
    .then(
      result =>
        FormBuilderChatJob.update(
          { status: CHAT_JOB_STATUSES.COMPLETE, result },
          { where: { id: jobId } },
        ),
      error => {
        log.warn({ error }, 'AI form builder async chat job failed');
        return FormBuilderChatJob.update(
          { status: CHAT_JOB_STATUSES.FAILED, error: serializeChatJobError(error) },
          { where: { id: jobId } },
        );
      },
    )
    .catch(updateError => {
      log.error({ error: updateError }, 'AI form builder failed to record async chat job result');
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
      // Resolve the session up front (rather than lazily inside the job) and
      // return it with the jobId, so the client retains the conversation even
      // if it stops before the job result arrives. Otherwise a stopped first
      // turn loses the sessionId and the next message starts a fresh session,
      // dropping any uploaded image's interpretation. A stale sessionId (lost on
      // restart / a different process) also falls back to a fresh session.
      const sessionId =
        payload.sessionId && (await req.aiService.hasSession(payload.sessionId))
          ? payload.sessionId
          : await req.aiService.createSession(AI_CONTEXT_NAMES.FORM_BUILDER);
      const jobId = await startChatJob({
        aiService: req.aiService,
        models: req.models,
        userId: req.user.id,
        payload: { ...payload, sessionId },
      });
      res.status(202).send({ jobId, sessionId, status: CHAT_JOB_STATUSES.PENDING });
      return;
    }

    res.send(await processChatRequest({ aiService: req.aiService, ...payload }));
  }),
);

formBuilderRouter.get(
  '/chat/jobs/:jobId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'FormBuilder');

    const { FormBuilderChatJob } = req.models;
    const job = await FormBuilderChatJob.findOne({
      where: { id: req.params.jobId, expiresAt: { [Op.gt]: new Date() } },
    });

    // Jobs are persisted and shared across processes, and the pending row is
    // created before the jobId is returned — so a missing job means it never
    // existed or has expired. Fail fast (rather than leaving the client polling)
    // so it can start a fresh request. Also don't reveal another user's job.
    if (!job || job.userId !== req.user.id) {
      throw new NotFoundError('AI form builder chat job was not found');
    }

    res.send({
      id: job.id,
      status: job.status,
      result: job.result ?? undefined,
      error: job.error ?? undefined,
    });
  }),
);
