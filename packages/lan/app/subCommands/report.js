import { Command } from 'commander';

import { log } from 'shared/services/logging';
import { initDatabase } from '../database';

async function report({ name }) {
  const context = await initDatabase();
  // going via inline import rather than top-level just to keep diff footprint small during a hotfix
  // should be fine to pull to the top level
  const { getReportModule } = await import('shared/reports');
  const module = getReportModule(name);
  log.info(`Running report ${name} (with empty parameters)`);
  const result = await module.dataGenerator(context, {});
  // console.log is fine because this command should return output
  // eslint-disable-next-line no-console
  console.log(result);
  process.exit(0);
}

export const reportCommand = new Command('report')
  .description('Generate a report')
  .requiredOption('-n, --name <string>', 'Name of the report')
  .action(report);
