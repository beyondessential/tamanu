import config from 'config';

import { COMMUNICATION_STATUSES, REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { createTupaiaApiClient, translateReportDataToSurveyResponses } from 'shared/utils';

import { removeFile, createZippedExcelFile } from '../utils/files';

// run at 30 seconds interval, process 10 report requests each time
export class ReportRequestProcessor extends ScheduledTask {
  constructor(context) {
    super('*/30 * * * * *', log);
    this.context = context;
  }

  async run() {
    const requests = await this.context.store.models.ReportRequest.findAll({
      where: {
        status: REPORT_REQUEST_STATUSES.RECEIVED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: 10,
    });

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!config.mailgun.from) {
        log.error(`ReportRequestProcessorError - Email config missing`);
        request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
        return;
      }

      const disabledReports = config.localisation.data.disabledReports;
      if (disabledReports.includes(request.reportType)) {
        log.error(`Report "${request.reportType}" is disabled`);
        request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
        return;
      }

      const reportModule = getReportModule(request.reportType);
      const reportDataGenerator = reportModule?.dataGenerator;
      if (!reportModule || !reportDataGenerator) {
        log.error(
          `ReportRequestProcessorError - Unable to find report generator for report ${request.id} of type ${request.reportType}`,
        );
        request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
        return;
      }

      let reportData = null;
      try {
        if (reportModule.needsTupaiaApiClient) {
          if (!this.tupaiaApiClient) {
            this.tupaiaApiClient = createTupaiaApiClient();
          }
        }
        reportData = await reportDataGenerator(
          this.context.store.models,
          request.getParameters(),
          this.tupaiaApiClient,
        );
      } catch (e) {
        log.error(`ReportRequestProcessorError - Failed to generate report, ${e.message}`);
        log.error(e.stack);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
        return;
      }

      try {
        await this.sendReport(request, reportData);
        await request.update({
          status: REPORT_REQUEST_STATUSES.PROCESSED,
        });
      } catch (e) {
        log.error(`ReportRequestProcessorError - Failed to send, ${e.message}`);
        log.error(e.stack);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
      }
    }
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @returns {Promise<void>}
   */
  async sendReport(request, reportData) {
    let sent = false;
    const recipients = request.getRecipients();
    if (recipients.email) {
      await this.sendReportToEmail(request, reportData, recipients.email);
      sent = true;
    }
    if (recipients.tupaia) {
      await this.sendReportToTupaia(request, reportData);
      sent = true;
    }
    if (!sent) {
      throw new Error('No recipients');
    }
  }

  /**
   * @param request ReportRequest
   * @param reportData []
   * @param emailAddresses string[]
   * @returns {Promise<void>}
   */
  async sendReportToEmail(request, reportData, emailAddresses) {
    const reportName = `${request.reportType}-report-${new Date().getTime()}`;

    let zipFile = null;
    try {
      zipFile = await createZippedExcelFile(reportName, reportData);

      const result = await this.context.emailService.sendEmail({
        from: config.mailgun.from,
        to: emailAddresses.join(','),
        subject: 'Report delivery',
        text: `Report requested: ${request.reportType}`,
        attachment: zipFile,
      });
      if (result.status === COMMUNICATION_STATUSES.SENT) {
        log.info(
          `ReportRequestProcessorError - Sent report ${zipFile} to ${emailAddresses.join(',')}`,
        );
      } else {
        throw new Error(`Mailgun error: ${result.error}`);
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
  async sendReportToTupaia(request, reportData) {
    const reportConfig = config.reports?.[request.reportType];

    if (!reportConfig) {
      throw new Error('Report not configured');
    }

    const { surveyId } = reportConfig;

    const translated = translateReportDataToSurveyResponses(surveyId, reportData);

    if (!this.tupaiaApiClient) {
      this.tupaiaApiClient = createTupaiaApiClient();
    }

    await this.tupaiaApiClient.meditrak.createSurveyResponses(translated);
  }
}
