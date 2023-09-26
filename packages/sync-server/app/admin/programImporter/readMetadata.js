import { log } from 'shared/services/logging';
import config from 'config';
import { utils } from 'xlsx';

import { ImporterMetadataError, ValidationError } from '../errors';

import { idify } from './idify';

function checkHomeServer(homeServer) {
  log.debug('Check where we are importing');

  if (!homeServer) return true;

  // detect if we're importing to home server
  const { canonicalHostName: host } = config;

  // ignore slashes when comparing servers - easiest way to account for trailing slashes that may or may not be present
  const importingToHome = homeServer.replace('/', '') === host.replace('/', '');

  if (!importingToHome) {
    if (!host.match(/(localhost|dev|demo|staging)/)) {
      throw new ImporterMetadataError(
        `This workbook can only be imported to ${homeServer} or a non-production (dev/demo/staging) server. (nb: current server is ${host})`,
      );
    }
  }

  return importingToHome;
}

export function readTwoModelTypeSheet(sheet, sheetName) {
  // The sheet follows this structure:
  // first few rows: data for the primary record (key in column A, value in column B)
  // then: secondary record header row (with name & code in columns A/B, then other keys)
  // then: secondary record values (corresponding to keys in the header row)
  const primaryRecord = {};

  // Read rows as part of the primary record until we hit the header row
  // (this should be within the first few rows, there shouldn't be that many keys and
  // there's no reason to add blank rows here)
  const headerRowIndex = (() => {
    const rowsToSearch = 10;
    for (let i = 0; i < rowsToSearch; ++i) {
      const cell = sheet[`A${i + 1}`];
      if (!cell) continue;
      if (cell.v === 'code' || cell.v === 'name') {
        // we've hit the header row -- immediately return
        return i;
      }
      const nextCell = sheet[`B${i + 1}`];
      if (!nextCell) continue;
      primaryRecord[cell.v.trim()] = nextCell.v.trim();
    }

    // we've exhausted the search
    throw new ImporterMetadataError(
      `A survey workbook ${sheetName} sheet must have a row starting with a 'name' or 'code' cell in the first 10 rows`,
    );
  })();

  return {
    primaryRecord,
    secondaryRecords: utils.sheet_to_json(sheet, { range: headerRowIndex }),
  };
}

export function readMetadata(metadataSheet) {
  log.debug('Checking for metadata sheet');
  if (!metadataSheet) {
    throw new ImporterMetadataError('A program workbook must have a sheet named Metadata');
  }

  log.debug('Reading metadata for survey header row');
  const { primaryRecord: metadata, secondaryRecords: surveyRows } = readTwoModelTypeSheet(
    metadataSheet,
    'Metadata',
  );

  if (!metadata.programCode) {
    throw new ImporterMetadataError('A program must have a code');
  }

  if (!metadata.programName) {
    throw new ImporterMetadataError('A program must have a name');
  }

  const importingToHome = checkHomeServer(metadata.homeServer);

  // Use a country prefix if we're importing to a server other than the home server.
  // eg a program will import as "(Samoa) NCD Screening" on the dev server, but
  // just "NCD Screening" on the Samoa server. Same goes for surveys.
  const { country } = metadata;
  const prefix = !importingToHome && country ? `(${country}) ` : '';

  const programName = `${prefix}${metadata.programName}`;
  const programId = `program-${idify(metadata.programCode)}`;

  const surveyMetadata = surveyRows
    .map(row => ({
      ...row,
      // Note: __rowNum__ is a non-enumerable property, so needs to be accessed explicitly here
      // -1 as it'll have 2 added to it later but it's only 1 off
      rowIndex: row.__rowNum__ - 1,
      sheetName: row.name,
      id: `${programId}-${idify(row.code)}`,
      name: `${prefix}${row.name}`,
      programId,
    }))
    .filter(({ status, name, rowIndex }) => {
      // check against home server & publication status
      switch (status || 'draft') {
        case 'publish':
          return true;
        case 'hidden':
          return false;
        case 'draft':
          // import drafts only to non-home servers (ie dev servers)
          return !importingToHome;
        default:
          throw new ValidationError(
            'Metadata',
            // ValidationError gives the index +1 for the header to find the sheet row,
            // but we have the index of the sheet row already
            rowIndex - 1,
            `Survey ${name} has invalid status ${status}. Must be one of publish, draft, hidden.`,
          );
      }
    });

  if (surveyMetadata.some(({ sheetName }) => sheetName === 'Registry')) {
    throw new ImporterMetadataError('Cannot have a survey called "Registry"');
  }

  return {
    programRecord: {
      name: programName,
      id: programId,
    },
    surveyMetadata,
  };
}
