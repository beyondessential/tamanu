import { log } from 'shared/services/logging';
import { EmailService } from '../app/services/EmailService';
import { ReportRunner } from '../app/report/ReportRunner';
import { initDatabase } from '../app/database';

export async function report(options) {
  const store = await initDatabase({ testMode: false });
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
      store.models,
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
