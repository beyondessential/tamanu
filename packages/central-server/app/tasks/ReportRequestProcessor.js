import config from 'config';
import sequelize from 'sequelize';
import { spawn } from 'child_process';

import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { getReportModule } from '@tamanu/shared/reports';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

import { ReportRunner } from '../report/ReportRunner';
import { getLocalisation } from '../localisation';

export class ReportRequestProcessor extends ScheduledTask {
  getName() {
    return 'ReportRequestProcessor';
  }

  constructor(context) {
    // run at 30 seconds interval, process 10 report requests each time
    const conf = config.schedules.reportRequestProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
    this.childProcesses = new Map();

    this.registerExitListeners();
  }

  registerExitListeners() {
    const killChildProcesses = event => {
      this.childProcesses.forEach(childProcess => {
        if (!childProcess?.kill || childProcess.killed) return;
        childProcess.kill(childProcess.pid, event);
        log.info('Cleaned up child process that was not killed by the parent process');
      });
    };
    process.on(['uncaughtException', 'SIGINT', 'SIGTERM'], killChildProcesses);
  }

  spawnReportProcess = async request => {
    const [node, scriptPath] = process.argv;
    const {
      childProcessEnv,
      processOptions,
      timeOutDurationSeconds,
    } = await this.context.settings.get('reportProcess');
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

    const sleepAfterReport = await this.context.settings.get('reportProcess.sleepAfterReport');
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
        '--sleepAfterReport',
        JSON.stringify(sleepAfterReport),
      ],
      {
        // Time out and kill the report process if it takes too long to run (default 2 hours)
        timeout: timeOutDurationSeconds * 1000,
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
        this.childProcesses.delete(childProcess.pid);
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

      this.childProcesses.set(childProcess.pid, childProcess);
    });
  };

  runReportInTheSameProcess = async request => {
    log.info(
      `Running report request "${
        request.id
      }" for report "${request.getReportId()}" in main process.`,
    );

    const sleepAfterReport = await this.context.settings.get('reportProcess.sleepAfterReport');
    const reportRunner = new ReportRunner(
      request.getReportId(),
      request.getParameters(),
      request.getRecipients(),
      this.context.store,
      this.context.reportSchemaStores,
      this.context.emailService,
      request.requestedByUserId,
      request.exportFormat,
      sleepAfterReport,
    );

    await reportRunner.run();
  };

  async countQueue() {
    return this.context.store.models.ReportRequest.count({
      where: {
        status: REPORT_REQUEST_STATUSES.RECEIVED,
      },
    });
  }

  async runReports() {
    const localisation = await getLocalisation();
    const requests = await this.context.store.models.ReportRequest.findAll({
      where: {
        status: REPORT_REQUEST_STATUSES.RECEIVED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: this.config.limit,
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

      const { disabledReports } = localisation;
      if (disabledReports.includes(reportId)) {
        log.error(`Report "${reportId}" is disabled`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: `Report "${reportId}" is disabled`,
        });
        return;
      }

      const reportModule = await getReportModule(reportId, this.context.store.models);
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

        const shouldRunInChildProcess = await this.context.settings.get(
          'reportProcess.runInChildProcess',
        );
        const runReport = shouldRunInChildProcess
          ? this.spawnReportProcess
          : this.runReportInTheSameProcess;
        await runReport(request);

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
    try {
      const timeOutDurationSeconds = await this.context.settings.get(
        'reportProcess.timeOutDurationSeconds',
      );
      const requests = await this.context.store.models.ReportRequest.findAll({
        where: sequelize.literal(
          `status = '${REPORT_REQUEST_STATUSES.PROCESSING}' AND
          EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - process_started_time) > ${timeOutDurationSeconds}`,
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
