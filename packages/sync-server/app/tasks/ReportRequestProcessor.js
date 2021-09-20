import config from 'config';
import sequelize from 'sequelize';
import { spawn } from 'child_process';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

// time out and kill the report process if it takes more than 2 hours to run
const REPORT_TIME_OUT_DURATION_SECONDS = 2 * 60 * 60;
const REPORT_TIME_OUT_DURATION_MILLISECONDS = REPORT_TIME_OUT_DURATION_SECONDS * 1000;

export class ReportRequestProcessor extends ScheduledTask {
  getName = () => {
    return 'ReportRequestProcessor';
  };

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
      { timeout: REPORT_TIME_OUT_DURATION_MILLISECONDS },
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

  async validateTimeoutReports() {
    try {
      const requests = await this.context.store.models.ReportRequest.findAll({
        where: sequelize.literal(
          `status = '${REPORT_REQUEST_STATUSES.PROCESSING}' AND 
          EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - process_started_time) > ${REPORT_TIME_OUT_DURATION_SECONDS}`,
        ), // find processing report requests that have been running more than the timeout limit
        order: [['createdAt', 'ASC']], // process in order received
        limit: 10,
      });

      for (const request of requests) {
        log.info(
          `ReportRequestProcessorError - Marking report request "${request.id}" as timed out`,
        );
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: 'Report timed out',
        });
      }
    } catch (error) {
      log.error('ReportRequestProcessorError - Error checking processing reports', error);
    }
  }

  async run() {
    await this.validateTimeoutReports();
    await this.runReports();
  }
}
