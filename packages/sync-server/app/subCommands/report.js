import { Command } from 'commander';
import path from 'path';

import { log } from 'shared/services/logging';
import { REPORT_DEFINITIONS } from 'shared/reports';

import { EmailService } from '../services/EmailService';
import { ReportRunner } from '../report/ReportRunner';
import { initDatabase } from '../database';
import { setupEnv } from '../env';

async function report(options) {
  const store = await initDatabase({ testMode: false });
  setupEnv();
  try {
    const { name, parameters, recipients } = options;
    const validNames = REPORT_DEFINITIONS.map(d => d.id);
    if (!validNames.some(n => n === name)) {
      const nameOutput = validNames.map(n => `\n  ${n}`).join('');
      throw new Error(`invalid name '${name}', must be one of: ${nameOutput}`);
    }
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
      log.warn(error);
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
    log.info(
      `Running report "${name}" with parameters "${parameters}" and recipients "${recipients}"`,
    );
    await reportRunner.run();
  } catch (error) {
    // Send error message back to parent process
    process.stderr.write(`Report failed: ${error.message}\n`);
    process.exit(1);
  }
  process.exit(0);
}

export const reportCommand = new Command('report')
  .description('Generate a report')
  .option('-n, --name <string>', 'Name of the report') // validated in function
  .requiredOption(
    '-r, --recipients <json|csv>',
    'JSON recipients or comma-separated list of emails',
    // {"local":[{"format": "csv","path":"./tamanu-reports"}]}
    JSON.stringify({
      local: [
        { format: 'csv', path: path.join(process.cwd(), 'tamanu-reports') },
        { format: 'xlsx', path: path.join(process.cwd(), 'tamanu-reports') },
      ],
    }),
  )
  .option('-p, --parameters <json>', 'JSON parameters')
  .action(report);
