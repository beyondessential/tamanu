import config from 'config';
import sequelize from 'sequelize';
import { spawn } from 'child_process';

import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { getReportModule } from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

import { ReportRunner } from '../report/ReportRunner';

export class ReportRequestProcessor extends ScheduledTask {
  getName() {
    return 'ReportRequestProcessor';
  }

  constructor({ schedules, settings, store, emailService }) {
    super(schedules.reportRequestProcessor.schedule, log);
    this.settings = settings;
    this.store = store;
    this.emailService = emailService;
  }

  spawnReportProcess = async request => {
    const [node, scriptPath] = process.argv;
    const { processOptions } = config.reportProcess;
    const parameters = processOptions || process.execArgv;
    const { timeoutDurationSeconds, childProcessEnv } = await this.settings.get('reportProcess');

    log.info(
      `Spawning child process for report request "${
        request.id
      }" for report "${request.getReportId()}" with command [${node}, ${parameters.toString()}, ${scriptPath}].`,
    );

    // For some reasons, when running a child process under pm2, pm2_env was not set and caused a problem.
    // So this is a work around
    const childEnv = childProcessEnv || {
      ...process.env,
      pm2_env: JSON.stringify(process.env),
    };

    const childProcess = spawn(
      node,
      [
        ...parameters,
        scriptPath,
        'report',
        '--reportId',
        request.getReportId(),
        '--parameters',
        request.parameters,
        '--recipients',
        request.recipients,
        '--userId',
        request.requestedByUserId,
        '--format',
        request.exportFormat,
      ],
      {
        // time out and kill the report process if it takes more than 2 hours to run
        timeout: timeoutDurationSeconds * 1000,
        env: childEnv,
      },
    );

    let errorMessage = '';
    const captureErrorOutput = message => {
      if (message.startsWith('Report failed:')) {
        errorMessage = message;
      }
    };

    return new Promise((resolve, reject) => {
      childProcess.on('exit', code => {
        if (code === 0) {
          log.info(
            `Child process running report request "${
              request.id
            }" for report "${request.getReportId()}" has finished.`,
          );
          resolve();
          return;
        }
        reject(
          new Error(
            errorMessage ||
              `Failed to generate report for report request "${
                request.id
              }" for report "${request.getReportId()}"`,
          ),
        );
      });

      childProcess.on('error', () => {
        reject(
          new Error(`Child process failed to start, using commands [${node}, ${scriptPath}].`),
        );
      });

      // Catch error from child process
      childProcess.stdout.on('data', data => {
        captureErrorOutput(data.toString());
        process.stdout.write(data);
      });
      childProcess.stderr.on('data', data => {
        captureErrorOutput(data.toString());
        process.stderr.write(data);
      });
    });
  };

  async runReportInTheSameProcess(request) {
    const reportId = request.getReportId();
    log.info(`Running report request "${request.id}" for report "${reportId}" in main process.`);
    const reportRunner = new ReportRunner(
      { store: this.store, emailService: this.emailService },
      {
        reportId,
        userId: request.requestedByUserId,
        parameters: request.getParameters(),
        recipients: request.getRecipients(),
      },
    );

    await reportRunner.run();
  }

  async countQueue() {
    return this.store.models.ReportRequest.count({
      where: {
        status: REPORT_REQUEST_STATUSES.RECEIVED,
      },
    });
  }

  async runReports() {
    const limit = await this.settings.get('reportRequestProcessorLimit');
    const requests = await this.store.models.ReportRequest.findAll({
      where: {
        status: REPORT_REQUEST_STATUSES.RECEIVED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit,
    });

    for (const request of requests) {
      const reportId = request.getReportId();

      if (!config.mailgun.from) {
        log.error(`ReportRequestProcessorError - Email config missing`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: 'Email config missing',
        });
        return;
      }

      const disabledReports = this.settings.get('disabledReports');
      if (disabledReports.includes(reportId)) {
        log.error(`Report "${reportId}" is disabled`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: `Report "${reportId}" is disabled`,
        });
        return;
      }

      const reportModule = await getReportModule(reportId, this.store.models);
      const reportDataGenerator = reportModule?.dataGenerator;
      if (!reportModule || !reportDataGenerator) {
        log.error(
          `ReportRequestProcessorError - Unable to find report generator for report ${request.id} of type ${reportId}`,
        );
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: `Unable to find report generator for report ${request.id} of type ${reportId}`,
        });
        return;
      }

      try {
        await request.update({
          status: REPORT_REQUEST_STATUSES.PROCESSING,
          processStartedTime: new Date(),
        });

        if (config.reportProcess.runInChildProcess) {
          await this.spawnReportProcess(request);
        } else {
          await this.runReportInTheSameProcess(request);
        }

        await request.update({
          status: REPORT_REQUEST_STATUSES.PROCESSED,
        });
      } catch (e) {
        log.error(`${e.stack}\nReportRequestProcessorError - Failed to generate report`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: e.stack,
        });
      }
    }
  }

  async validateTimeoutReports() {
    const timeoutDurationSeconds = await this.settings.get('reportProcess.timeOutDurationSeconds');
    try {
      const requests = await this.store.models.ReportRequest.findAll({
        where: sequelize.literal(
          `status = '${REPORT_REQUEST_STATUSES.PROCESSING}' AND 
          EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - process_started_time) > ${timeoutDurationSeconds}`,
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
