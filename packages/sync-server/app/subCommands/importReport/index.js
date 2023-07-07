import { Command } from 'commander';
import { promises as fs } from 'fs';
import { initDatabase } from '../../database';
import * as importUtils from './utils';
import * as importActions from './actions';

export async function importReport(options) {
  const versionData = JSON.parse(await fs.readFile(options.file));
  const name = options.name || versionData.name;

  if (!name) {
    throw new Error("Name must be provided in the JSON file or via the -n parameter");
  }

  const store = await initDatabase({ testMode: false });
  const definition = await importUtils.findOrCreateDefinition(name, store);
  const versions = await definition.getVersions();
  await importActions.createVersion(versionData, definition, versions, store, options.verbose);
  process.exit(0);
}

export const importReportCommand = new Command('importReport')
  .description('Import a JSON report definition version')
  .requiredOption('-f, --file <path>', 'Path to report definition version data JSON')
  .option('-v, --verbose', 'log additional details during import')
  .option('-n, --name <string>', 'override JSON-defined report name')
  .action(importReport);

async function listReport(options) {
  const store = await initDatabase({ testMode: false });
  const definition = await importUtils.findOrCreateDefinition(options.name, store);
  const versions = await definition.getVersions();
  await importActions.listVersions(definition, versions, store);
  process.exit(0);
}

export const listReportCommand = new Command('importReport')
  .description('List the existing versions of a report definition')
  .requiredOption('-n, --name <string>', 'Name of the report')
  .action(listReport);
