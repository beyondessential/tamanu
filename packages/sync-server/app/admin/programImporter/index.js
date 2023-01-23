import { log } from 'shared/services/logging';
import { readFile, utils } from 'xlsx';
import { Op } from 'sequelize';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { validateQuestions } from './validateQuestions';

import { ImporterMetadataError, ValidationError } from '../errors';
import { importRows } from '../importRows';

import { idify } from './idify';
import { importSurveySheet } from './screens';
import { readMetadata } from './readMetadata';

export const PERMISSIONS = ['Program', 'Survey'];

export async function importer({ errors, models, stats, file, whitelist = [] }) {

  const context = sheetName => ({
    errors,
    log: log.child({
      file,
      sheetName,
    }),
    models,
  });

  log.info('Importing programs from file', { file });

  const workbook = readFile(file);
  const metadataSheet = workbook.Sheets.Metadata;
  const programMetadata = await readMetadata(metadataSheet);

  // actually import the program to the database
  const { programId, programName } = programMetadata;
  stats.push(
    await importRows(context('metadata'), {
      sheetName: 'metadata',
      rows: [
        {
          model: 'Program',
          values: { id: programId, name: programName },
          sheetRow: 0,
        },
      ],
    }),
  );

  // read metadata table starting at header row
  const surveyMetadata = utils.sheet_to_json(metadataSheet, { range: programMetadata.headerRowIndex });

  const shouldImportSurvey = ({ status = '', name, code }, row) => {
    // check against whitelist
    if (whitelist && whitelist.length > 0) {
      if (!whitelist.some(x => x === name || x === code)) {
        return false;
      }
    }

    // check against home server & publication status
    switch (status) {
      case 'publish':
        return true;
      case 'hidden':
        return false;
      case 'draft':
      case '':
        return !importingToHome;
      default:
        throw new ValidationError(
          'Metadata',
          row,
          `Survey ${name} has invalid status ${status}. Must be one of publish, draft, hidden.`,
        );
    }
  };

  log.debug('Loop over surveys', { count: surveyMetadata.length });

  // then loop over each survey defined in metadata and import it
  for (const md of surveyMetadata.filter(shouldImportSurvey)) {
    const sheetName = md.name;

    const surveyData = {
      ...programMetadata.createSurveyInfo(md),
      surveyType: md.surveyType,
      isSensitive: md.isSensitive,
    };

    let surveyRows = [
      {
        model: 'Survey',
        sheetRow: -2,
        values: surveyData,
      },
    ];

    // always read obsolete surveys, but only the first rows
    // this is so we don't miss surveys that have just been obsoleted
    if (md.surveyType === 'obsolete') {
      stats.push(
        await importRows(context(sheetName), {
          sheetName,
          rows: surveyRows,
        }),
      );
      continue;
    }

    // There should only be one instance of a vitals survey
    if (md.surveyType === 'vitals') {
      const vitalsCount = await models.Survey.count({
        where: { id: { [Op.not]: `${programId}-${idify(md.code)}` }, survey_type: 'vitals' },
      });
      if (vitalsCount > 0) {
        errors.push(
          new ImporterMetadataError('Only one vitals survey may exist at a time'),
        );
        continue;
      }
    }

    // Strip some characters from workbook names before trying to find them
    // (this mirrors the punctuation stripping that node-xlsx does internally)
    const worksheet = workbook.Sheets[sheetName.replace(/['"]/g, '')] || workbook.Sheets[md.code];
    if (!worksheet) {
      const keys = Object.keys(workbook.Sheets);
      errors.push(
        new ImporterMetadataError(`Sheet named "${sheetName}" was not found in the workbook. (found: ${keys})`),
      );
      continue;
    }

    const data = utils.sheet_to_json(worksheet);

    if (md.surveyType === 'vitals') {
      if (
        !validateQuestions({ ...surveyData, errors }, data, {
          requiredFields: Object.values(VITALS_DATA_ELEMENT_IDS),
        })
      ) {
        continue;
      }
    }

    surveyRows = surveyRows.concat(importSurveySheet(data, surveyData));

    stats.push(
      await importRows(context(sheetName), {
        sheetName,
        rows: surveyRows,
      }),
    );
  }

  log.debug('Done importing programs data');
}
