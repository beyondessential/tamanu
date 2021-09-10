import config from 'config';

import { COMMUNICATION_STATUSES, REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

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
      const requestObject = request.get({ plain: true });
      if (!config.mailgun.from) {
        log.error(`ReportRequestProcessorError - Email config missing`);
        request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
        return;
      }

      const disabledReports = config.localisation.data.disabledReports;
      if (disabledReports.includes(requestObject.reportType)) {
        log.error(`Report "${requestObject.reportType}" is disabled`);
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
      const reportName = `${requestObject.reportType}-report-${new Date().getTime()}`;
      let zipFile;
      try {
        const parameters = requestObject.parameters ? JSON.parse(requestObject.parameters) : {};
        const excelData = await reportDataGenerator(this.context.store.models, parameters);
        zipFile = await createZippedExcelFile(reportName, excelData);
        const result = await this.context.emailService.sendEmail({
          from: config.mailgun.from,
          to: request.recipients,
          subject: 'Report delivery',
          text: `Report requested: ${requestObject.reportType}`,
          attachment: zipFile,
        });
        if (result.status === COMMUNICATION_STATUSES.SENT) {
          log.info(`ReportRequestProcessor - Sent report "${zipFile}" to "${request.recipients}"`);
          await request.update({
            status: REPORT_REQUEST_STATUSES.PROCESSED,
          });
        } else {
          log.error(`ReportRequestProcessorError - Mailgun error: ${result.error}`);
          await request.update({
            status: REPORT_REQUEST_STATUSES.ERROR,
          });
        }
      } catch (e) {
        log.error(`ReportRequestProcessorError - Failed to generate report, ${e.message}`);
        log.error(e.stack);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
      } finally {
        if (zipFile) {
          await removeFile(zipFile);
        }
      }
    }
  }
}
