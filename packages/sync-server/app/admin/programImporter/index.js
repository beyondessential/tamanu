import { log } from 'shared/services/logging';
import { readFile, utils } from 'xlsx';
import config from 'config';
import { Op } from 'sequelize';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { validateQuestions } from './validateQuestions';

import { ValidationError } from '../errors';
import { importRows } from '../importRows';

import { idify } from './idify';
import { importSurveySheet } from './screens';

export const PERMISSIONS = ['Program', 'Survey'];

export async function importer({ errors, models, stats, file, whitelist = [] }) {
  log.info('Importing programs from file', { file });

  log.info(`Reading surveys from ${file}...`);
  const workbook = readFile(file);

  log.debug('Checking for metadata sheet');
  const metadataSheet = workbook.Sheets.Metadata;
  if (!metadataSheet) {
    throw new ValidationError(
      'Metadata',
      -2,
      'A program workbook must have a sheet named Metadata',
    );
  }

  // The Metadata sheet follows this structure:
  // first few rows: program metadata (key in column A, value in column B)
  // then: survey metadata header row (with name & code in columns A/B, then other keys)
  // then: survey metadata values (corresponding to keys in the header row)

  const programMetadata = {};

  // Read rows as program metadata until we hit the survey header row
  // (this should be within the first few rows, there aren't many program metadata keys and
  // there's no reason to add blank rows here)
  log.debug('Reading metadata for survey header row');
  const headerRow = (() => {
    const rowsToSearch = 10; // there are only a handful of metadata keys, so give up pretty early
    for (let i = 0; i < rowsToSearch; ++i) {
      const cell = metadataSheet[`A${i + 1}`];
      if (!cell) continue;
      if (cell.v === 'code' || cell.v === 'name') {
        // we've hit the header row -- immediately return
        return i;
      }
      const nextCell = metadataSheet[`B${i + 1}`];
      if (!nextCell) continue;
      programMetadata[cell.v.trim()] = nextCell.v.trim();
    }

    // we've exhausted the search
    throw new ValidationError(
      'Metadata',
      0,
      "A survey workbook Metadata sheet must have a row starting with a 'name' or 'code' cell in the first 10 rows",
    );
  })();

  log.debug('Check where we are importing');

  // detect if we're importing to home server
  const { homeServer = '', country } = programMetadata;
  const { canonicalHostName: host } = config;

  // ignore slashes when comparing servers - easiest way to account for trailing slashes that may or may not be present
  const importingToHome = !homeServer || homeServer.replace('/', '') === host.replace('/', '');

  if (!importingToHome) {
    if (!host.match(/(localhost|dev|demo|staging)/)) {
      throw new ValidationError(
        'Metadata',
        headerRow,
        `This workbook can only be imported to ${homeServer} or a non-production (dev/demo/staging) server. (nb: current server is ${host})`,
      );
    }
  }

  log.debug('Check code/name presence');

  if (!programMetadata.programCode) {
    throw new ValidationError('Metadata', headerRow, 'A program must have a code');
  }

  if (!programMetadata.programName) {
    throw new ValidationError('Metadata', headerRow, 'A program must have a name');
  }

  // Use a country prefix (eg "(Samoa)" if we're importing to a server other
  // than the home server.
  const prefix = !importingToHome && country ? `(${country}) ` : '';
  log.debug('Prefix: ', { prefix });

  const programId = `program-${idify(programMetadata.programCode)}`;
  const programName = `${prefix}${programMetadata.programName}`;

  const context = sheetName => ({
    errors,
    log: log.child({
      file,
      sheetName,
    }),
    models,
  });

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
  const surveyMetadata = utils.sheet_to_json(metadataSheet, { range: headerRow });

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
      id: `${programId}-${idify(md.code)}`,
      name: `${prefix}${sheetName}`,
      programId,
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
    // this is so we don't miss surveys that have just been made obsolete
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
          new ValidationError(sheetName, -2, 'Only one vitals survey may exist at a time'),
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
        new ValidationError(
          sheetName,
          -2,
          `Sheet named "${sheetName}" was not found in the workbook. (found: ${keys})`,
        ),
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
