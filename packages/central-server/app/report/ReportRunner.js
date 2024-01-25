import fs from 'fs';
import path from 'path';
import { format as formatDate } from 'date-fns';
import * as AWS from '@aws-sdk/client-s3';
import mkdirp from 'mkdirp';

import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { getReportModule } from '@tamanu/shared/reports';
import { createNamedLogger } from '@tamanu/shared/services/logging/createNamedLogger';

import { removeFile, createZippedSpreadsheet, writeToSpreadsheet } from '../utils/files';

const REPORT_RUNNER_LOG_NAME = 'ReportRunner';

export class ReportRunner {
  constructor(context, runParameters) {
    const { store, settings, emailService, reportSchemaStores } = context;
    const { reportId, userId, parameters, recipients, exportFormat } = runParameters;
    this.log = createNamedLogger(REPORT_RUNNER_LOG_NAME, { reportId, userId });
    this.settings = settings;
    this.store = store;
    this.emailService = emailService;
    this.reportId = reportId;
    this.parameters = parameters;
    this.recipients = recipients;
    this.reportSchemaStores = reportSchemaStores;
    this.exportFormat = exportFormat;

    this.userId = userId;
  }

  async validate(reportModule, reportDataGenerator) {
    const sender = await this.settings.get('mailgun.from');

    if (this.recipients.email && !sender) {
      throw new Error('ReportRunner - Email config missing');
    }

    const disabledReports = await this.settings.get('disabledReports');

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
      this.log.info('Running report', { parameters: this.parameters });
      reportData = await reportModule.dataGenerator(
        { ...this.store, reportSchemaStores: this.reportSchemaStores },
        this.parameters,
      );

      metadata = await this.getMetadata();

      this.log.info('Running report finished', {
        parameters: this.parameters,
      });
    } catch (e) {
      this.log.error('Error running report', {
        stack: e.stack,
        parameters: this.parameters,
      });
      if (this.recipients.email) {
        await this.sendErrorToEmail(e);
      }
      throw new Error(`${e.stack}\nReportRunner - Failed to generate report`);
    }

    try {
      await this.sendReport({ data: reportData, metadata });
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
    const reportName = await this.getReportName();

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
   *
   * @returns {Promise<string>}
   */
  async getReportName() {
    const countryName = await this.settings.get('country.name');

    let reportName = this.reportId;

    const dbDefinedReportModule = await this.store.models.ReportDefinitionVersion.findByPk(
      this.reportId,
      { include: ['reportDefinition'] },
    );

    if (dbDefinedReportModule) {
      reportName = `${dbDefinedReportModule.reportDefinition.name}`;
    }

    const date = formatDate(new Date(), 'ddMMyyyy');

    const dashedName = `${reportName}-${countryName}`
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
    const sender = await this.settings.get('mailgun.from');
    let zipFile;
    try {
      zipFile = await createZippedSpreadsheet(reportName, reportData, this.exportFormat);
      const recipients = this.recipients.email.join(',');

      this.log.info('Sending report', {
        recipients,
        zipFile,
      });

      const result = await this.emailService.sendEmail({
        from: sender,
        to: recipients,
        subject: 'Report delivery',
        text: `Report requested: ${reportName}`,
        attachment: zipFile,
      });
      if (result.status === COMMUNICATION_STATUSES.SENT) {
        this.log.info('Mailgun sent report', {
          recipients,
          zipFile,
        });
      } else {
        this.log.error('Mailgun error', {
          recipients,
          stack: result.error,
        });
        throw new Error(`ReportRunner - Mailgun error: ${result.error}`);
      }
    } finally {
      if (zipFile) await removeFile(zipFile);
    }
  }

  async sendErrorToEmail(e) {
    const sender = await this.settings.get('mailgun.from');
    try {
      const user = await this.getRequestedByUser();
      const reportName = await this.getReportName();
      this.emailService.sendEmail({
        from: sender,
        to: user.email,
        subject: 'Failed to generate report',
        message: `Report requested: ${reportName} failed to generate with error: ${e.message}`,
      });
    } catch (e2) {
      this.log.error('Issue sending error to email', {
        stack: e2.stack,
      });
    }
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @returns {Promise<void>}
   */
  async sendReportToS3(reportData) {
    const bucket = await this.settings.get('reportUploadS3Bucket');

    if (!bucket.path) {
      throw new Error(`bucketPath must be set, e.g. 'au'`);
    }

    let zipFile;
    const bookType = 'csv';
    try {
      const reportName = await this.getReportName();
      zipFile = await createZippedSpreadsheet(reportName, reportData, bookType);

      const { region, name } = bucket;
      const filename = path.basename(zipFile);
      const key = `${bucket.path}/${filename}`;

      this.log.info('Uploading report to S3', {
        name,
        key,
        region,
      });

      const client = new AWS.S3({ region });

      const fileStream = fs.createReadStream(zipFile);

      await client.send(
        new AWS.PutObjectCommand({
          Bucket: name,
          Key: key,
          Body: fileStream,
        }),
      );

      this.log.info('Uploaded report to S3', {
        zipFile,
      });
    } finally {
      if (zipFile) await removeFile(zipFile);
    }
  }
}
