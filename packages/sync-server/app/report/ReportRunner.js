import config from 'config';
import fs from 'fs';
import path from 'path';
import { format as formatDate } from 'date-fns';
import * as AWS from '@aws-sdk/client-s3';
import mkdirp from 'mkdirp';

import { COMMUNICATION_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { log } from 'shared/services/logging';

import { removeFile, createZippedSpreadsheet, writeToSpreadsheet } from '../utils/files';
import { getLocalisation } from '../localisation';

const REPORT_RUNNER_LOG_NAME = 'ReportRunner';

const getReportRunnerLogMessage = message => `${REPORT_RUNNER_LOG_NAME} - ${message}`;

const logReportRunnerInfo = (message, reportId, data = {}) =>
  log.info(getReportRunnerLogMessage(message), { name: REPORT_RUNNER_LOG_NAME, reportId, ...data });
const logReportRunnerError = (error, message, reportId, data = {}) =>
  log.error(getReportRunnerLogMessage(message), {
    name: REPORT_RUNNER_LOG_NAME,
    stack: error.stack,
    reportId,
    ...data,
  });

export class ReportRunner {
  constructor(reportId, parameters, recipients, store, emailService, userId) {
    this.reportId = reportId;
    this.parameters = parameters;
    this.recipients = recipients;
    this.store = store;
    this.emailService = emailService;
    this.userId = userId;
  }

  async validate(reportModule, reportDataGenerator) {
    const localisation = await getLocalisation();

    if (this.recipients.email && !config.mailgun.from) {
      throw new Error('ReportRunner - Email config missing');
    }

    const { disabledReports } = localisation;
    if (disabledReports.includes(this.reportId)) {
      throw new Error(`ReportRunner - Report "${this.reportId}" is disabled`);
    }

    if (!reportModule || !reportDataGenerator) {
      throw new Error(
        `ReportRunner - Unable to find report generator for report "${this.reportId}"`,
      );
    }
  }

  /**
   *
   * @returns {Promise<string>}
   */
  async getRequestedByUser() {
    return this.store.models.User.findByPk(this.userId);
  }

  /**
   *
   * @returns {Promise<string[][]>}
   */
  async getMetadata() {
    const user = await this.getRequestedByUser();
    const date = formatDate(new Date(), 'dd/MM/yyyy');
    const reportName = await this.getReportName();
    const filterString = Object.entries(this.parameters || [])
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return [
      ['Report Name:', reportName],
      ['Date Generated:', date],
      ['User:', user.email],
      ['Filters:', filterString],
    ];
  }

  async run() {
    const reportModule = await getReportModule(this.reportId, this.store.models);
    const reportDataGenerator = reportModule?.dataGenerator;

    await this.validate(reportModule, reportDataGenerator);

    let reportData = null;
    let metadata = [];
    try {
      logReportRunnerInfo('Running report', this.reportId);

      reportData = await reportModule.dataGenerator(this.store, this.parameters);
      metadata = await this.getMetadata();

      logReportRunnerInfo('Running report finished', this.reportId);
    } catch (e) {
      logReportRunnerError(e, 'Error running report', this.reportId);
      this.sendErrorToEmail(e);
      throw new Error(`${e.stack}\\${REPORT_RUNNER_LOG_NAME} - Failed to generate report`);
    }

    try {
      await this.sendReport({ data: reportData, metadata });
    } catch (e) {
      throw new Error(`${e.stack}\nReportRunner - Failed to send`);
    }
  }

  async sendError(e) {
    if (this.recipients.email) {
      await this.sendErrorToEmail(e);
    }
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @returns {Promise<void>}
   */
  async sendReport(reportData) {
    let sent = false;
    if (this.recipients.email) {
      await this.sendReportToEmail(reportData);
      sent = true;
    }
    if (this.recipients.s3) {
      await this.sendReportToS3(reportData);
      sent = true;
    }
    if (this.recipients.local) {
      await this.sendReportToLocal(reportData);
      sent = true;
    }
    if (!sent) {
      const error = new Error(`${REPORT_RUNNER_LOG_NAME} - No recipients`);
      logReportRunnerError(error, 'No recipients', this.reportId);
      throw error;
    }
  }

  /**
   * @param reportData
   * @returns {Promise<void>}
   */
  async sendReportToLocal(reportData) {
    const reportName = await this.getReportName();

    for (const recipient of this.recipients.local) {
      const { format, path: reportFolder } = recipient;
      if (!format || !reportFolder) {
        const str = JSON.stringify(recipient);
        const error = new Error(
          `${REPORT_RUNNER_LOG_NAME} - local recipients must specifiy a format and a path, got: ${str}`,
        );
        logReportRunnerError(error, 'Format or path missing in local recipient', this.reportId, {
          recipient: str,
        });
        throw error;
      }
      await mkdirp(reportFolder);

      const reportNameExtended = `${reportName}.${format}`;
      const reportPath = path.resolve(reportFolder, reportNameExtended);
      const outputPath = await writeToSpreadsheet(reportData, reportPath, format);
      // eslint-disable-next-line no-console
      console.log(outputPath);
    }
  }

  /**
   *
   * @returns {Promise<string>}
   */
  async getReportName() {
    const { country } = await getLocalisation();

    let reportName = this.reportId;

    const dbDefinedReportModule = await this.store.models.ReportDefinitionVersion.findByPk(
      this.reportId,
      { include: ['reportDefinition'] },
    );

    if (dbDefinedReportModule) {
      reportName = `${dbDefinedReportModule.reportDefinition.name}`;
    }

    const date = formatDate(new Date(), 'ddMMyyyy');

    const dashedName = `${reportName}-${country.name}`
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return `tamanu-report-${date}-${dashedName}`;
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @param emailAddresses string[]
   * @returns {Promise<void>}
   */
  async sendReportToEmail(reportData) {
    const reportName = await this.getReportName();

    let zipFile;
    try {
      zipFile = await createZippedSpreadsheet(reportName, reportData);
      const recipients = this.recipients.email.join(',');

      logReportRunnerInfo('Sending report', this.reportId, {
        recipients,
      });

      const result = await this.emailService.sendEmail({
        from: config.mailgun.from,
        to: recipients,
        subject: 'Report delivery',
        text: `Report requested: ${reportName}`,
        attachment: zipFile,
      });
      if (result.status === COMMUNICATION_STATUSES.SENT) {
        logReportRunnerInfo('Mail sent report', this.reportId, {
          recipients,
        });
      } else {
        logReportRunnerError(result.error, 'Mailgun error', this.reportId, {
          recipients,
        });
        throw new Error(`${REPORT_RUNNER_LOG_NAME} - Mailgun error: ${result.error}`);
      }
    } finally {
      if (zipFile) await removeFile(zipFile);
    }
  }

  async sendErrorToEmail(err) {
    const reportName = await this.getReportName();
    this.emailService.sendEmail({
      from: config.mailgun.from,
      to: this.recipients.email.join(','),
      subject: 'Failed to generate report',
      message: `Report requested: ${reportName} failed to generate with error: ${err.message}`,
    });
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @returns {Promise<void>}
   */
  async sendReportToS3(reportData) {
    const { region, bucketName, bucketPath } = config.s3;

    if (!bucketPath) {
      throw new Error(`bucketPath must be set, e.g. 'au'`);
    }

    let zipFile;
    const bookType = 'csv';
    try {
      const reportName = await this.getReportName();
      zipFile = await createZippedSpreadsheet(reportName, reportData, bookType);

      const filename = path.basename(zipFile);

      logReportRunnerInfo('Uploading report to S3', this.reportId, {
        path: `${bucketName}/${bucketPath}/${filename}`,
        region,
      });

      const client = new AWS.S3({ region });

      const fileStream = fs.createReadStream(zipFile);

      await client.send(
        new AWS.PutObjectCommand({
          Bucket: bucketName,
          Key: `${bucketPath}/${filename}`,
          Body: fileStream,
        }),
      );

      logReportRunnerInfo('Uploaded report to S3', this.reportId, {
        zipFile,
      });
    } finally {
      if (zipFile) await removeFile(zipFile);
    }
  }
}
