import { log } from 'shared/services/logging';
import { Command } from 'commander';
import { promises as fs } from 'fs';
import { initDatabase } from '../database';

const DEFAULT_USER_EMAIL = 'admin@tamanu.io';

async function importReport(options) {
  const data = await fs.readFile(options.file);
  const report = JSON.parse(data);
  const store = await initDatabase({ testMode: false });
  const { ReportDefinitionVersion, ReportDefinition } = store.models;
  const [definition] = await ReportDefinition.findOrCreate({
    where: { name: options.name },
  });

  const versions = await definition.getVersions();
  if (versions.some(v => v.versionNumber === report.versionNumber)) {
    const latestVersion = versions.reduce(
      (acc, v) => (v.versionNumber > acc ? v.versionNumber : acc),
      0,
    );
    const incrementedVersion = latestVersion + 1;
    log.info(`supplied version already exists in database, incrementing to ${incrementedVersion}`);
    report.versionNumber = incrementedVersion;
  }
  let { userId } = report;
  if (!report.userId) {
    const user = await store.models.User.findOne({
      where: { email: DEFAULT_USER_EMAIL },
    });
    userId = user.id;
  }

  const request = await ReportDefinitionVersion.create({
    definitionId: definition.id,
    userId,
    ...report,
  });

  log.info(`Created new report version ${request.versionNumber} for definition ${options.name}`);
  process.exit(0);
}

export const importReportCommand = new Command('importReport')
  .description('Imports a JSON report definition version into Tamanu')
  .requiredOption('-f, --file <path>', 'Path to report definition version data JSON')
  .requiredOption('-n, --name <string>', 'Name of the report')
  .action(importReport);
