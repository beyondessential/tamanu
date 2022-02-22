import { Command } from 'commander';

import { log } from 'shared/services/logging';
import { EmailService } from '../services/EmailService';
import { ReportRunner } from '../report/ReportRunner';
import { initDatabase } from '../database';
import { setupEnv } from '../env';

async function report(options) {
  const store = await initDatabase({ testMode: false });
  setupEnv();
  try {
    const { name, parameters, recipients } = options;
    let reportParameters = {};
    let reportRecipients = {};
    try {
      reportParameters = JSON.parse(parameters);
    } catch (error) {
      log.warn(`Failed to parse parameters ${error}`);
    }

    try {
      reportRecipients = JSON.parse(recipients);
    } catch (error) {
      // Backwards compatibility: support previous syntax of plain string
      reportRecipients = {
        email: recipients.split(','),
      };
    }

    const emailService = new EmailService();
    const reportRunner = new ReportRunner(
      name,
      reportParameters,
      reportRecipients,
      store,
      emailService,
    );
    log.info(`Running report "${name}" with parameters "${parameters}"`);
    await reportRunner.run();
  } catch (error) {
    // Send error message back to parent process
    process.stderr.write(`Report failed: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

export const reportCommand = new Command('report')
  .description('Generate a report')
  .requiredOption('-n', '--name <string>', 'Name of the report')
  .requiredOption(
    '-r',
    '--recipients <json|csv>',
    'JSON recipients or comma-separated list of emails',
  )
  .option('-p', '--parameters <json>', 'JSON parameters')
  .action(report);
