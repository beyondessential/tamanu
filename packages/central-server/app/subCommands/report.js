import { Command } from 'commander';
import path from 'path';

import { log } from '@tamanu/shared/services/logging';
import { REPORT_DEFINITIONS } from '@tamanu/shared/reports';
import { REPORT_EXPORT_FORMATS } from '@tamanu/constants';
import { EmailService } from '../services/EmailService';
import { ReportRunner } from '../report/ReportRunner';
import { initDatabase, initReporting } from '../database';
import { setupEnv } from '../env';

const REPORT_HEAP_INTERVAL_MS = 1000;

const validateReportId = async (reportId, models) => {
  const dbDefinedReportModule = await models.ReportDefinitionVersion.findByPk(reportId);

  if (dbDefinedReportModule) {
    return true;
  }

  const validNames = REPORT_DEFINITIONS.map(d => d.id);

  if (!validNames.includes(reportId)) {
    const nameOutput = validNames.map(n => `\n  ${n}`).join('');
    throw new Error(
      `invalid name '${reportId}', must be one of: ${nameOutput} \n (hint - supply name with --reportId <reportId>)`,
    );
  }

  return true;
};

async function report(options) {
  if (options.heap) {
    setInterval(() => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      // eslint-disable-next-line no-console
      console.log(`Heap: ${used} MiB`);
    }, REPORT_HEAP_INTERVAL_MS);
  }

  const store = await initDatabase({ testMode: false });
  const reportSchemaStores = await initReporting();
  setupEnv();
  try {
    const { reportId, parameters, recipients, userId, format, sleepAfterReport } = options;

    await validateReportId(reportId, store.models);

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
      reportId,
      reportParameters,
      reportRecipients,
      store,
      reportSchemaStores,
      emailService,
      userId,
      format,
      sleepAfterReport,
    );
    log.info(
      `Running report "${reportId}" with parameters "${parameters}", recipients "${recipients}" and userId ${userId}`,
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
  .option('--reportId <string>', 'id of the report') // validated in function
  .option('--heap', `Report heap usage every ${REPORT_HEAP_INTERVAL_MS}ms`, false)
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
  .option('-u, --userId <string>', 'Requested by userId')
  .option('-f, --format <string>', 'Export format (xslx or csv)', REPORT_EXPORT_FORMATS.XLSX)
  .option(
    '-s, --sleepAfterReport <json>',
    'Sleep thread for `duration` if report takes longer than `ifRunAtLeast`',
  )
  .action(report);
