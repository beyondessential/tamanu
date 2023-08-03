import { utils } from 'xlsx';
import { SURVEY_TYPES } from 'shared/constants';

import { ImporterMetadataError } from '../errors';
import { importRows } from '../importRows';

import { readSurveyQuestions } from './readSurveyQuestions';
import { ensureRequiredQuestionsPresent, validateVitalsSurvey } from './validation';
import { validateProgramDataElementRecords } from './vitalsValidation';

function readSurveyInfo(workbook, surveyInfo) {
  const { sheetName, surveyType, code } = surveyInfo;

  const surveyRecord = {
    model: 'Survey',
    sheetRow: -2,
    values: surveyInfo,
  };

  // don't bother looking for the sheet of questions from obsoleted surveys
  // (it may not even exist in the doc, and that's fine)
  if (surveyType === SURVEY_TYPES.OBSOLETE) {
    return [surveyRecord];
  }

  // Strip some characters from workbook names before trying to find them
  // (this mirrors the punctuation stripping that node-xlsx does internally)
  const worksheet = workbook.Sheets[sheetName.replace(/['"]/g, '')] || workbook.Sheets[code];
  if (!worksheet) {
    const keys = Object.keys(workbook.Sheets);
    throw new ImporterMetadataError(
      `Sheet named "${sheetName}" was not found in the workbook. (found: ${keys})`,
    );
  }

  const data = utils.sheet_to_json(worksheet);

  const questionRecords = readSurveyQuestions(data, surveyInfo);
  ensureRequiredQuestionsPresent(surveyInfo, questionRecords);

  return [surveyRecord, ...questionRecords];
}

export async function importSurvey(context, workbook, surveyInfo) {
  const { sheetName, surveyType } = surveyInfo;

  if (surveyType === SURVEY_TYPES.VITALS) {
    await validateVitalsSurvey(context, surveyInfo);
  }

  const records = readSurveyInfo(workbook, surveyInfo);
  const stats = validateProgramDataElementRecords(records, { context, sheetName });

  return importRows(context, {
    sheetName,
    rows: records,
    stats,
  });
}
