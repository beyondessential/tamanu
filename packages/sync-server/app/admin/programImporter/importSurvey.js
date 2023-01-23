import { utils } from 'xlsx';
import { Op } from 'sequelize';
import { VITALS_DATA_ELEMENT_IDS, SURVEY_TYPES } from 'shared/constants';

import { ImporterMetadataError } from '../errors';
import { importRows } from '../importRows';

import { importSurveySheet } from './importSurveySheet';

export const PERMISSIONS = ['Program', 'Survey'];

export async function importSurvey(context, workbook, surveyInfo) {
  const { sheetName, surveyType, code } = surveyInfo;

  const surveyRecord = {
    model: 'Survey',
    sheetRow: -2,
    values: surveyInfo,
  };

  // don't bother importing questions from obsoleted surveys
  if (surveyType === SURVEY_TYPES.OBSOLETE) {
    return await importRows(context, {
      sheetName,
      rows: [surveyRecord],
    });
  }

  // There should only be one instance of a vitals survey
  if (surveyType === SURVEY_TYPES.VITALS) {
    const vitalsCount = await models.Survey.count({
      where: {
        id: {
          [Op.not]: surveyInfo.id,
        },
        survey_type: SURVEY_TYPES.VITALS,
      },
    });
    if (vitalsCount > 0) {
      throw new ImporterMetadataError('Only one vitals survey may exist at a time');
    }
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

  // check that each mandatory question ID has a corresponding row in the import sheet
  const requiredFields =
    surveyType === SURVEY_TYPES.VITALS ? Object.values(VITALS_DATA_ELEMENT_IDS) : [];
  const hasQuestion = id => data.some(q => q.id === id);
  const missingFields = requiredFields.filter(rf => !hasQuestion(rf));
  if (missingFields.length > 0) {
    throw new ImporterMetadataError(
      `Survey ${sheetName} missing required questions: ${missingFields.join(', ')}`,
    );
  }

  const questionRecords = importSurveySheet(data, surveyInfo);

  return await importRows(context, {
    sheetName,
    rows: [surveyRecord, ...questionRecords],
  });
}
