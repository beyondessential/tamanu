import { log } from 'shared/services/logging';
import Table from 'cli-table3';
import { REPORT_STATUSES } from 'shared/constants';
import { format } from 'date-fns';
import { verifyQuery, getLatestVersion } from './utils';

export const DEFAULT_USER_EMAIL = 'admin@tamanu.io';

const colorise = (colorCode, text) => `\x1b[${colorCode}m${text}\x1b[0m`;
export const ACTIVE_TEXT = colorise('32', 'active');
export const OVERWRITING_TEXT = colorise('1m', 'overwriting with new data');

export const formatUpdatedAt = date => format(date, 'P p');
export const getVersionError = ({ versionNumber }) =>
  new Error(
    `Version ${versionNumber} does not exist, remove versionNumber from JSON and try again to auto increment`,
  );

export async function createVersion(versionData, definition, versions, store, verbose) {
  const { ReportDefinitionVersion } = store.models;

  log.info('Analyzing query');
  await verifyQuery(
    versionData.query,
    versionData.queryOptions?.parameters,
    store,
    verbose,
  );
  log.info('Query is valid');

  if (Number.isInteger(versionData.versionNumber)) {
    const existingVersion = versions.find(v => v.versionNumber === versionData.versionNumber);
    if (!existingVersion) {
      throw getVersionError(versionData);
    }
    log.warn(`Version ${versionData.versionNumber} already exists, ${OVERWRITING_TEXT}`);
    versionData.id = existingVersion.id;
  } else {
    const latestVersion = getLatestVersion(versions);
    const versionNumber = (latestVersion?.versionNumber || 0) + 1;
    log.info(`Auto incrementing versionNumber to ${versionNumber}`);
    versionData.versionNumber = versionNumber;
  }

  let { userId } = versionData;
  if (!versionData.userId) {
    log.warn(`User id not specified`);
    const user = await store.models.User.findOne({
      where: { email: DEFAULT_USER_EMAIL },
    });
    log.info(`Using default user ${DEFAULT_USER_EMAIL}`);
    userId = user.id;
  }

  const [version] = await ReportDefinitionVersion.upsert({
    reportDefinitionId: definition.id,
    userId,
    ...versionData,
  });

  const created = !versionData.id;

  const isActive =
    version.status === REPORT_STATUSES.PUBLISHED &&
    (created || getLatestVersion(versions).versionNumber === version.versionNumber);

  log.info(
    `${created ? 'Created new' : 'Updated'} ${isActive ? `${ACTIVE_TEXT} ` : ''}version ${
      version.versionNumber
    } for definition ${definition.name}`,
  );
}

export async function listVersions(definition, versions) {
  if (!versions.length) {
    log.info(`No versions found for report definition ${definition.name}`);
    return;
  }
  const activeVersion = getLatestVersion(versions, REPORT_STATUSES.PUBLISHED);
  
  const table = new Table({
    head: ['Version', 'Status', 'Updated'],
  });
  versions.forEach(({ versionNumber, status, updatedAt }) => {
    const isActive = activeVersion?.versionNumber === versionNumber;
    table.push([
      versionNumber,
      `${status}${isActive ? ` ${ACTIVE_TEXT}` : ''}`,
      formatUpdatedAt(updatedAt),
    ]);
  });
  log.info(`Listing versions for report definition ${definition.name}\n${table.toString()}`);
}
