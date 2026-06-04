import { extname } from 'path';
import { readFile, utils } from 'xlsx';

import { log } from '@tamanu/shared/services/logging';

import {
  programDefinitionSchema,
  sanitizeProgramDefinitionPreview,
} from './programImporter/programDefinition';

export const WORKBOOK_FILE_EXTENSIONS = new Set(['.xls', '.xlsx']);

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

// Resolve the worksheet for a survey code. Sheet names are capped at 31
// characters and cannot contain Excel-forbidden characters. The program
// exporter writes the raw survey code, while the AI form builder normalises it
// (strips :/\?*[] then truncates via createSheetName) — try each form so
// re-uploaded AI workbooks resolve too.
const sheetNameCandidatesForCode = surveyCode => [
  surveyCode,
  surveyCode.slice(0, 31),
  surveyCode.replace(/[:/\\?*[\]]/g, '').slice(0, 31),
];

const findSurveySheetForCode = (workbook, surveyCode) => {
  for (const candidate of sheetNameCandidatesForCode(surveyCode)) {
    if (workbook.Sheets[candidate]) return workbook.Sheets[candidate];
  }
  return null;
};

// Deterministically parse a Tamanu program export workbook (a Metadata sheet
// plus one sheet per survey) into the ProgramDefinition shape. Returns null
// when the file isn't a recognisable program export, so the caller can fall
// back to the LLM flow.
export const parseProgramExportWorkbook = file => {
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

// Parse and validate an uploaded program export into a working ProgramDefinition,
// or return null when the file isn't a workbook or can't be read as one.
export const loadProgramDefinitionFromUpload = async ({ file, fileName }) => {
  if (!file) return null;
  if (!WORKBOOK_FILE_EXTENSIONS.has(extname(fileName || '').toLowerCase())) return null;
  try {
    const rawProgramDefinition = parseProgramExportWorkbook(file);
    if (!rawProgramDefinition) return null;
    return await programDefinitionSchema.parseAsync(
      sanitizeProgramDefinitionPreview(rawProgramDefinition),
    );
  } catch (error) {
    log.warn({ error }, 'AI form builder could not parse uploaded file as a program export');
    return null;
  }
};
