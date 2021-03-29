import config from 'config';
import { COMMUNICATION_STATUSES, REPORT_REQUEST_STATUSES } from 'shared/constants';
import {
  generateAdmissionsReport,
  generateCovidVaccineListReport,
  generateIncompleteReferralsReport,
  generateRecentDiagnosesReport,
  generateCovidVaccineSummaryDose1Report,
  generateCovidVaccineSummaryDose2Report,
} from 'shared/reports';
import { ScheduledTask } from 'shared/tasks';
import { log } from '~/logging';
import { sendEmail } from '../services/EmailService';
import { writeExcelFile } from '../utils/excel';
import { createFilePathForEmailAttachment, removeFile } from '../utils/files';

const reportDataGeneratorMapper = {
  admissions: generateAdmissionsReport,
  ['incomplete-referrals']: generateIncompleteReferralsReport,
  ['recent-diagnoses']: generateRecentDiagnosesReport,
  ['covid-vaccine-list']: generateCovidVaccineListReport,
  ['covid-vaccine-summary-dose1']: generateCovidVaccineSummaryDose1Report,
  ['covid-vaccine-summary-dose2']: generateCovidVaccineSummaryDose2Report,
};

// run at 30 seconds interval, process 10 report requests each time
export class ReportRequestProcessor extends ScheduledTask {
  constructor(context) {
    super('*/30 * * * * *', log);
    this.context = context;
  }

  async run() {
    let requests = await this.context.store.models.ReportRequest.findAll({
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
        log.error(`Email config missing`);
        return request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
      }

      const reportDataGenerator = reportDataGeneratorMapper[requestObject.reportType];

      if (!reportDataGenerator) {
        log.error(
          `Unable to find report generator for report ${requestObject.id} of type ${requestObject.reportType}`,
        );
        return request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
      }
      const fileName = await createFilePathForEmailAttachment(
        `${requestObject.reportType}-report-${new Date().getTime()}.xlsx`,
      );
      try {
        const parameters = requestObject.parameters ? JSON.parse(requestObject.parameters) : {};
        const excelData = await reportDataGenerator(this.context.store.models, parameters);
        await writeExcelFile(excelData, fileName);
        const result = await sendEmail({
          from: config.mailgun.from,
          to: request.recipients,
          subject: request.reportType,
          attachment: fileName,
        });
        if (result.status === COMMUNICATION_STATUSES.SENT) {
          await request.update({
            status: REPORT_REQUEST_STATUSES.PROCESSED,
          });
        } else {
          await request.update({
            status: REPORT_REQUEST_STATUSES.ERROR,
          });
        }
      } catch (e) {
        log.error(`Failed to generate report, ${e.message}`);
        log.error(e.stack);
        await request.update({
          status: REPORT_REQUEST_STATUSES.ERROR,
        });
      } finally {
        await removeFile(fileName);
      }
    }
  }
}
