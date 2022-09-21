import { Command } from 'commander';
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
    await importActions.createVersion(options.file, definition, versions, store, options.verbose);
  }
  process.exit(0);
}

export const importReportCommand = new Command('importReport')
  .description('Imports a JSON report definition version into Tamanu')
  .requiredOption('-n, --name <string>', 'Name of the report')
  .option('-f, --file <path>', 'Path to report definition version data JSON')
  .option('-l, --list', 'List all report definition versions')
  .option('-v, --verbose', 'log additional details during import')
  .action(importReport);
