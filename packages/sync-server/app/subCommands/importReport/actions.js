import { promises as fs } from 'fs';
import { log } from 'shared/services/logging';
import Table from 'cli-table3';
import { REPORT_STATUSES } from 'shared/constants';
import { format } from 'date-fns';
import * as reportUtils from './utils';

export const DEFAULT_USER_EMAIL = 'admin@tamanu.io';
export const ACTIVE_TEXT = '\x1b[32mactive\x1b[0m';
export const OVERWRITING_TEXT = '\x1b[1moverwriting with new data\x1b[0m';

export const formatUpdatedAt = date => format(date, 'P p');
export const getVersionError = ({ versionNumber }) =>
  new Error(
    `Version ${versionNumber} does not exist, remove versionNumber from JSON and try again to auto increment`,
  );

export async function createVersion(file, definition, versions, store, verbose) {
  const data = await fs.readFile(file);
  const versionData = JSON.parse(data);
  const { ReportDefinitionVersion } = store.models;

  log.info('Analyzing query');
  await reportUtils.verifyQuery(
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
    const latestVersion = reportUtils.getLatestVersion(versions);
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
    (created || reportUtils.getLatestVersion(versions).versionNumber === version.versionNumber);

  log.info(
    `${created ? 'Created new' : 'Updated'} ${isActive ? `${ACTIVE_TEXT} ` : ''}version ${
      version.versionNumber
    } for definition ${definition.name}`,
  );
}

export async function listVersions(definition, versions) {
  const table = new Table({
    head: ['Version', 'Status', 'Updated'],
  });
  if (!versions.length) {
    log.info(`No versions found for report definition ${definition.name}`);
    return;
  }
  const activeVersion = reportUtils.getLatestVersion(versions, REPORT_STATUSES.PUBLISHED);

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

export async function exportVersion(exportPath, versionNumber, exportSql, definition, versions) {
  const version = versionNumber
    ? versions.find(v => v.versionNumber === versionNumber)
    : reportUtils.getLatestVersion(versions, REPORT_STATUSES.PUBLISHED);
  if (!version) {
    log.error(
      versionNumber
        ? `Version ${versionNumber} not found for report definition ${definition.name}`
        : `No active version found for report definition ${definition.name}`,
    );
    return;
  }
  try {
    const data = exportSql ? version.query : JSON.stringify(version, null, 4);
    log.info(
      `Exporting ${exportSql ? 'JSON' : 'SQL'} for version ${
        version.versionNumber
      } for definition ${definition.name}`,
    );
    await fs.writeFile(exportPath, data);
    log.info(`Exported version ${version.versionNumber} for definition ${definition.name}`);
  } catch (err) {
    log.error(`Error exporting version ${version.versionNumber} for definition ${definition.name}`);
    log.error(err);
  }
}
