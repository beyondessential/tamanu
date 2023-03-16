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
  const exportPath = options.export || options.exportSql;
  if (exportPath) {
    await importActions.exportVersion(
      exportPath,
      options.version,
      options.exportSql,
      definition,
      versions,
      store,
    );
  }
  process.exit(0);
}

export const importReportCommand = new Command('importReport')
  .description('Imports a JSON report definition version into Tamanu')
  .requiredOption('-n, --name <string>', 'Name of the report')
  .option('-f, --file <path>', 'Path to report definition version data JSON')
  .option('-e, --export <path>', 'Export the report definition version data JSON to the given path')
  .option('--export-sql <path>', 'Export the report definition version data SQL to the given path')
  .option('-v,--version <number>', 'Version number to export')
  .option('-l, --list', 'List all report definition versions')
  .option('--verbose', 'log additional details during import')
  .action(importReport);
