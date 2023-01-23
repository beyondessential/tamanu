import { log } from 'shared/services/logging';
import config from 'config';

import { ImporterMetadataError } from '../errors';

import { idify } from './idify';

export const PERMISSIONS = ['Program', 'Survey'];

function checkHomeServer(homeServer) {
  log.debug('Check where we are importing');

  if (!homeServer) return true;

  // detect if we're importing to home server
  const { canonicalHostName: host } = config;

  // ignore slashes when comparing servers - easiest way to account for trailing slashes that may or may not be present
  const importingToHome = homeServer.replace('/', '') === host.replace('/', '');

  if (!importingToHome) {
    if (!host.match(/(localhost|dev|demo|staging)/)) {
      throw new ImporterMetadataError(`This workbook can only be imported to ${homeServer} or a non-production (dev/demo/staging) server. (nb: current server is ${host})`);
    }
  }

  return importingToHome;
}

export function readMetadata(metadataSheet) {
  // The Metadata sheet follows this structure:
  // first few rows: program metadata (key in column A, value in column B)
  // then: survey metadata header row (with name & code in columns A/B, then other keys)
  // then: survey metadata values (corresponding to keys in the header row)

  log.debug('Checking for metadata sheet');
  if (!metadataSheet) {
    throw new ImporterMetadataError('A program workbook must have a sheet named Metadata');
  }

  const metadata = {};

  // Read rows as program metadata until we hit the survey header row
  // (this should be within the first few rows, there aren't many program metadata keys and
  // there's no reason to add blank rows here)
  log.debug('Reading metadata for survey header row');
  const headerRowIndex = (() => {
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
      metadata[cell.v.trim()] = nextCell.v.trim();
    }

    // we've exhausted the search
    throw new ImporterMetadataError("A survey workbook Metadata sheet must have a row starting with a 'name' or 'code' cell in the first 10 rows");
  })();

  if (!metadata.programCode) {
    throw new ImporterMetadataError('A program must have a code');
  }

  if (!metadata.programName) {
    throw new ImporterMetadataError('A program must have a name');
  }

  const importingToHome = checkHomeServer(metadata.homeServer);

  // Use a country prefix (eg "(Samoa)" if we're importing to a server other
  // than the home server.
  const prefix = !importingToHome && country ? `(${country}) ` : '';
  
  const programName = `${prefix}${metadata.programName}`;
  const programId = `program-${idify(metadata.programCode)}`;

  const createSurveyInfo = (surveySheet) => ({
    id: `${programId}-${idify(surveySheet.code)}`,
    name: `${prefix}${surveySheet.name}`,
    programId,
  });

  return {
    ...metadata,
    importingToHome,
    headerRowIndex,
    programName,
    programId,
    createSurveyInfo,
  };
}