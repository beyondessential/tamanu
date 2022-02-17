import { log } from 'shared/services/logging';
import { initDatabase } from '../database';

export async function report(options) {
  const context = await initDatabase();
  // going via inline import rather than top-level just to keep diff footprint small during a hotfix
  // should be fine to pull to the top level
  const { getReportModule } = await import('shared/reports');
  const module = getReportModule(options.name);
  log.info(`Running report ${options.name} (with empty parameters)`);
  const result = await module.dataGenerator(context, {});
  console.log(result);
  process.exit(0);
}
