import config from 'config';
import fs from 'fs';
import path from 'path';
import * as AWS from '@aws-sdk/client-s3';
import mkdirp from 'mkdirp';

import { COMMUNICATION_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { log } from 'shared/services/logging';

import { removeFile, createZippedSpreadsheet, writeToSpreadsheet } from '../utils/files';
import { getLocalisation } from '../localisation';

export class ReportRunner {
  constructor(reportName, parameters, recipients, store, emailService) {
    this.reportName = reportName;
    this.parameters = parameters;
    this.recipients = recipients;
    this.store = store;
    this.emailService = emailService;
  }

  async validate(reportModule, reportDataGenerator) {
    const localisation = await getLocalisation();

    if (this.recipients.email && !config.mailgun.from) {
      throw new Error('ReportRunner - Email config missing');
    }

    const { disabledReports } = localisation;
    if (disabledReports.includes(this.reportName)) {
      throw new Error(`ReportRunner - Report "${this.reportName}" is disabled`);
    }

    if (!reportModule || !reportDataGenerator) {
      throw new Error(
        `ReportRunner - Unable to find report generator for report "${this.reportName}"`,
      );
    }
  }

  async run() {
    const reportModule = getReportModule(this.reportName);
    const reportDataGenerator = reportModule?.dataGenerator;

    await this.validate(reportModule, reportDataGenerator);

    let reportData = null;
    try {
      log.info(`ReportRunner - Running report "${this.reportName}"`);

      reportData = await reportDataGenerator(this.store, this.parameters);

      log.info(`ReportRunner - Running report "${this.reportName}" finished`);
    } catch (e) {
      throw new Error(`${e.stack}\nReportRunner - Failed to generate report`);
    }

    try {
      await this.sendReport(reportData);
    } catch (e) {
      throw new Error(`${e.stack}\nReportRunner - Failed to send`);
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
      throw new Error('ReportRunner - No recipients');
    }
  }

  /**
   * @param reportData
   * @returns {Promise<void>}
   */
  async sendReportToLocal(reportData) {
    const reportName = this.getReportName();
    for (const recipient of this.recipients.local) {
      const { format, path: reportFolder } = recipient;
      if (!format || !reportFolder) {
        const str = JSON.stringify(recipient);
        throw new Error(
          `ReportRunner - local recipients must specify a format and a path, got: ${str}`,
        );
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
   * @returns {string}
   */
  getReportName() {
    return `${this.reportName}-report-${new Date().getTime()}`;
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @param emailAddresses string[]
   * @returns {Promise<void>}
   */
  async sendReportToEmail(reportData) {
    const reportName = this.getReportName();

    let zipFile;
    try {
      zipFile = await createZippedSpreadsheet(reportName, reportData);

      log.info(
        `ReportRunner - Sending report "${zipFile}" to "${this.recipients.email.join(',')}"`,
      );

      const result = await this.emailService.sendEmail({
        from: config.mailgun.from,
        to: this.recipients.email.join(','),
        subject: 'Report delivery',
        text: `Report requested: ${this.reportName}`,
        attachment: zipFile,
      });
      if (result.status === COMMUNICATION_STATUSES.SENT) {
        log.info(`ReportRunner - Sent report "${zipFile}" to "${this.recipients.email.join(',')}"`);
      } else {
        throw new Error(`ReportRunner - Mailgun error: ${result.error}`);
      }
    } finally {
      if (zipFile) await removeFile(zipFile);
    }
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
      zipFile = await createZippedSpreadsheet(this.reportName, reportData, bookType);

      const filename = path.basename(zipFile);

      log.info(
        `ReportRunner - Uploading report to s3 "${bucketName}/${bucketPath}/${filename}" (${region})`,
      );

      const client = new AWS.S3({ region });

      const fileStream = fs.createReadStream(zipFile);

      await client.send(
        new AWS.PutObjectCommand({
          Bucket: bucketName,
          Key: `${bucketPath}/${filename}`,
          Body: fileStream,
        }),
      );

      log.info(`ReportRunner - Uploaded report "${zipFile}" to s3`);
    } finally {
      if (zipFile) await removeFile(zipFile);
    }
  }
}
