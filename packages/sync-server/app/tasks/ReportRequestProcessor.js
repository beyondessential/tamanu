import config from 'config';

import { COMMUNICATION_STATUSES, REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

import { sendEmail } from '../services/EmailService';
import { writeExcelFile } from '../utils/excel';
import { createFilePathForEmailAttachment, removeFile } from '../utils/files';

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
      const requestObject = request.get({ plain: true });
      if (!config.mailgun.from) {
        log.error(`ReportRequestProcessorError - Email config missing`);
        request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
        return;
      }

      const reportDataGenerator = getReportModule(requestObject.reportType)?.dataGenerator;
      if (!reportDataGenerator) {
        log.error(
          `ReportRequestProcessorError - Unable to find report generator for report ${requestObject.id} of type ${requestObject.reportType}`,
        );
        request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
        return;
      }

      let reportData = null;
      try {
        const parameters = requestObject.parameters ? JSON.parse(requestObject.parameters) : {};
        reportData = await reportDataGenerator(this.context.store.models, parameters);
      } catch (e) {
        log.error(`ReportRequestProcessorError - Failed to generate report, ${e.message}`);
        log.error(e.stack);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
      }

      try {
        await this.sendReport(requestObject, reportData);
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
   * @param request {}
   * @param reportData []
   * @returns {Promise<void>}
   */
  async sendReport(request, reportData) {
    if (Array.isArray(request.recipients.email)) {
      await this.sendReportToEmail(request, reportData, request.recipients.email);
    }
  }

  async sendReportToEmail(request, reportData, emailAddresses) {
    const fileName = await createFilePathForEmailAttachment(
      `${request.reportType}-report-${new Date().getTime()}.xlsx`,
    );

    try {
      await writeExcelFile(reportData, fileName);

      const result = await sendEmail({
        from: config.mailgun.from,
        to: emailAddresses.join(','),
        subject: 'Report delivery',
        text: `Report requested: ${request.reportType}`,
        attachment: fileName,
      });
      if (result.status === COMMUNICATION_STATUSES.SENT) {
        log.info(
          `ReportRequestProcessorError - Sent report ${fileName} to ${emailAddresses.join(',')}`,
        );
      } else {
        throw new Error(`Mailgun error: ${result.error}`);
      }
    } finally {
      await removeFile(fileName);
    }
  }
}
