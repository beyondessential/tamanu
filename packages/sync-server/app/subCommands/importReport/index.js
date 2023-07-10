import { Command } from 'commander';
import { promises as fs } from 'fs';
import { initDatabase } from '../../database';
import * as importUtils from './utils';
import * as importActions from './actions';

export async function importReport(options) {
  const store = await initDatabase({ testMode: false });
  const definition = await importUtils.findOrCreateDefinition(options.name, store);
  const versions = await definition.getVersions();
  if (options.list) {
    await importActions.listVersions(definition, versions, store);
  }
  if (options.file) {
    const versionData = JSON.parse(await fs.readFile(options.file));
    await importActions.createVersion(versionData, definition, versions, store, options.verbose);
  }
  process.exit(0);
}

export const importReportCommand = new Command('importReport')
  .description('Imports a JSON report definition version into Tamanu')
  .requiredOption('-n, --name <string>', 'Name of the report')
  .option('-f, --file <path>', 'Path to report definition version data JSON')
  .option('-l, --list', 'List all report definition versions')
  .option('-v, --verbose', 'Log additional details during import')
  .action(importReport);
