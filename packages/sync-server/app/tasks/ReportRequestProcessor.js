import config from 'config';
import sequelize from 'sequelize';
import { spawn } from 'child_process';

import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

import { ReportRunner } from '../report/ReportRunner';
import { getLocalisation } from '../localisation';

// time out and kill the report process if it takes more than 2 hours to run
const REPORT_TIME_OUT_DURATION_MILLISECONDS = config.reportProcess.timeOutDurationSeconds * 1000;

export class ReportRequestProcessor extends ScheduledTask {
  getName = () => 'ReportRequestProcessor';

  constructor(context) {
    // run at 30 seconds interval, process 10 report requests each time
    const conf = config.schedules.reportRequestProcessor;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  spawnReportProcess = async request => {
    const [node, scriptPath] = process.argv;
    const { processOptions } = config.reportProcess;
    const parameters = processOptions || process.execArgv;

    log.info(
      `Spawning child process for report request "${request.id}" for report "${
        request.reportType
      }" with command [${node}, ${parameters.toString()}, ${scriptPath}].`,
    );

    // For some reasons, when running a child process under pm2, pm2_env was not set and caused a problem.
    // So this is a work around
    const childProcessEnv = config.reportProcess.childProcessEnv || {
      ...process.env,
      pm2_env: JSON.stringify(process.env),
    };
    const childProcess = spawn(
      node,
      [
        ...parameters,
        scriptPath,
        'report',
        '--name',
        request.reportType,
        '--parameters',
        request.parameters,
        '--recipients',
        request.recipients,
      ],
      {
        timeout: REPORT_TIME_OUT_DURATION_MILLISECONDS,
        env: childProcessEnv,
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
            `Child process running report request "${request.id}" for report "${request.reportType}" has finished.`,
          );
          resolve();
          return;
        }
        reject(
          new Error(
            errorMessage ||
              `Failed to generate report for report request "${request.id}" for report "${request.reportType}"`,
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
    log.info(
      `Running report request "${request.id}" for report "${request.reportType}" in main process.`,
    );
    const reportRunner = new ReportRunner(
      request.reportType,
      request.getParameters(),
      request.getRecipients(),
      this.context.store,
      this.context.emailService,
    );

    await reportRunner.run();
  }

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
      if (!config.mailgun.from) {
        log.error(`ReportRequestProcessorError - Email config missing`);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
          error: 'Email config missing',
        });
        return;
      }

      const { disabledReports } = localisation;
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
    try {
      const requests = await this.context.store.models.ReportRequest.findAll({
        where: sequelize.literal(
          `status = '${REPORT_REQUEST_STATUSES.PROCESSING}' AND 
          EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - process_started_time) > ${config.reportProcess.timeOutDurationSeconds}`,
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
