import sequelize from 'sequelize';
import config from 'config';
import { spawn } from 'child_process';

import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { getReportModule } from '@tamanu/shared/reports';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

import { ReportRunner } from '../report/ReportRunner';

export class ReportRequestProcessor extends ScheduledTask {
  getName() {
    return 'ReportRequestProcessor';
  }

  constructor({ schedules, settings, store, emailService, reportsSchemasStore }) {
    const { jitterTime } = config.schedules.reportRequestProcessor;
    super(schedules.reportRequestProcessor.schedule, log, jitterTime);
    this.settings = settings;
    this.store = store;
    this.emailService = emailService;
    this.reportsSchemasStore = reportsSchemasStore;
  }

  spawnReportProcess = async request => {
    const [node, scriptPath] = process.argv;
    const { timeoutDurationSeconds, childProcessEnv, processOptions } = await this.settings.get(
      'reportProcess',
    );
    const parameters = processOptions || process.execArgv;

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
      {
        store: this.store,
        emailService: this.emailService,
        reportSchemaStores: this.reportSchemaStores,
      },
      {
        reportId,
        userId: request.requestedByUserId,
        parameters: request.getParameters(),
        recipients: request.getRecipients(),
        exportFormat: request.exportFormat,
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
    const limit = await this.settings.get('schedules.reportRequestProcessor.limit');
    const requests = await this.store.models.ReportRequest.findAll({
      where: {
        status: REPORT_REQUEST_STATUSES.RECEIVED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit,
    });

    const sender = await this.settings.get('mailgun.from');

    for (const request of requests) {
      const reportId = request.getReportId();

      if (!sender) {
        log.error(`ReportRequestProcessorError - Email config missing`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: 'Email config missing',
        });
        return;
      }

      const disabledReports = await this.settings.get('disabledReports');
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

        const runInChildProcess = await this.settings.get('reportProcess.runInChildProcess');

        if (runInChildProcess) {
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
