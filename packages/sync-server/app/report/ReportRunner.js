import config from 'config';
import { COMMUNICATION_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { log } from 'shared/services/logging';
import { createTupaiaApiClient, translateReportDataToSurveyResponses } from 'shared/utils';

import { removeFile, createZippedExcelFile } from '../utils/files';

export class ReportRunner {
  constructor(reportName, parameters, recipients, store, emailService) {
    this.reportName = reportName;
    this.parameters = parameters;
    this.recipients = recipients;
    this.store = store;
    this.emailService = emailService;
    this.tupaiaApiClient = null;
  }

  validate(reportModule, reportDataGenerator) {
    if (!config.mailgun.from) {
      throw new Error('ReportRunner - Email config missing');
    }

    const disabledReports = config.localisation.data.disabledReports;
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

    this.validate(reportModule, reportDataGenerator);

    let reportData = null;
    try {
      if (reportModule.needsTupaiaApiClient) {
        if (!this.tupaiaApiClient) {
          this.tupaiaApiClient = createTupaiaApiClient();
        }
      }

      log.info(`ReportRunner - Running report "${this.reportName}"`);

      reportData = await reportDataGenerator(this.store, this.parameters, this.tupaiaApiClient);

      log.info(`ReportRunner - Running report "${this.reportName}" finished`);
    } catch (e) {
      throw new Error(`Failed to generate report, ${e.message}`);
    }

    try {
      await this.sendReport(reportData);
    } catch (e) {
      throw new Error(`Failed to send, ${e.message}`);
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
    if (this.recipients.tupaia) {
      await this.sendReportToTupaia(reportData);
      sent = true;
    }
    if (!sent) {
      throw new Error('ReportRunner - No recipients');
    }
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @param emailAddresses string[]
   * @returns {Promise<void>}
   */
  async sendReportToEmail(reportData) {
    const reportName = `${this.reportName}-report-${new Date().getTime()}`;

    let zipFile = null;
    try {
      zipFile = await createZippedExcelFile(reportName, reportData);

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
      await removeFile(zipFile);
    }
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @returns {Promise<void>}
   */
  async sendReportToTupaia(reportData) {
    const reportConfig = config.reports?.[this.reportName];

    if (!reportConfig) {
      throw new Error('ReportRunner - Report not configured');
    }

    const { surveyId } = reportConfig;

    const translated = translateReportDataToSurveyResponses(surveyId, reportData);

    if (!this.tupaiaApiClient) {
      this.tupaiaApiClient = createTupaiaApiClient();
    }

    await this.tupaiaApiClient.meditrak.createSurveyResponses(translated);
  }
}
