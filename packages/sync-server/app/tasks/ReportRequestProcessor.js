import config from 'config';
import { spawn } from 'child_process';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

// time out if the report takes more than 1 hour to run
const REPORT_TIME_OUT_DURATION = 60 * 60 * 1000;

export class ReportRequestProcessor extends ScheduledTask {

  getName() {
    return 'ReportRequestProcessor';
  }

  constructor(context) {
    // run at 30 seconds interval, process 10 report requests each time
    super(config.schedules.reportRequestProcessor, log);
    this.context = context;
  }

  spawnReportProcess = request => {
    log.info(`Spawning child process for report request "${request.id}"`);
    const childProcess = spawn(
      'node',
      [
        './dist/app.bundle.js',
        'report',
        '--reportName',
        request.reportType,
        '--reportParameters',
        request.parameters,
        '--reportRecipients',
        request.recipients,
      ],
      { timeout: REPORT_TIME_OUT_DURATION },
    );

    // Comment out to see info about the child processes
    // childProcess.stdout.setEncoding('utf8');
    // childProcess.stdout.on('data', data => {
    //   console.log('stdout: ', data.toString());
    // });

    childProcess.on('exit', code => {
      if (code === 0) {
        log.info(`Child process running report request "${request.id}" has finished.`);
        request.update({
          status: REPORT_REQUEST_STATUSES.PROCESSED,
        });
      } else {
        log.error(
          `Child process running report "${request.reportType}" has exited due to an error.`,
        );
        request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: `ReportRequestProcessorError - Failed to generate report for report request "${request.id}"`,
        });
      }
    });
  };

  async runReports() {
    const requests = await this.context.store.models.ReportRequest.findAll({
      where: {
        status: REPORT_REQUEST_STATUSES.RECEIVED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: 10,
    });

    for (const request of requests) {
      if (!config.mailgun.from) {
        log.error(`ReportRequestProcessorError - Email config missing`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: 'Email config missing',
        });
        return;
      }

      const disabledReports = config.localisation.data.disabledReports;
      if (disabledReports.includes(request.reportType)) {
        log.error(`Report "${request.reportType}" is disabled`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: `Report "${request.reportType}" is disabled`,
        });
        return;
      }

      const reportModule = getReportModule(request.reportType);
      const reportDataGenerator = reportModule?.dataGenerator;
      if (!reportModule || !reportDataGenerator) {
        log.error(
          `ReportRequestProcessorError - Unable to find report generator for report ${request.id} of type ${request.reportType}`,
        );
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: `Unable to find report generator for report ${request.id} of type ${request.reportType}`,
        });
        return;
      }

      try {
        await request.update({
          status: REPORT_REQUEST_STATUSES.PROCESSING,
          processStartedTime: new Date(),
        });

        this.spawnReportProcess(request);
      } catch (e) {
        log.error(`ReportRequestProcessorError - Failed to generate report, ${e.message}`);
        log.error(e.stack);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: `Failed to generate report, ${e.message}`,
        });
      }
    }
  }

  async checkProcessingReports() {
    try {
      const requests = await this.context.store.models.ReportRequest.findAll({
        where: {
          status: REPORT_REQUEST_STATUSES.PROCESSING,
        },
        order: [['createdAt', 'ASC']], // process in order received
        limit: 10,
      });

      const now = new Date().getTime();
      for (const request of requests) {
        const processingDuration = now - request.processStartedTime;

        if (processingDuration > REPORT_TIME_OUT_DURATION) {
          log.info(
            `ReportRequestProcessorError - Marking report request "${request.id}" as timed out`,
          );
          await request.update({
            status: REPORT_REQUEST_STATUSES.ERROR,
            error: 'Report timed out',
          });
        }
      }
    } catch (error) {
      log.error('ReportRequestProcessorError - Error checking processing reports');
    }
  }

  async run() {
    await this.checkProcessingReports();
    await this.runReports();
  }
}
