import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { ScheduledTask } from 'shared/tasks';
import { log } from '~/logging';

export class ReportRequestProcessor extends ScheduledTask {
  constructor(context) {
    super('*/5 * * * * *', log);
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
    const markRequestsAsProcessed = requests.map(request => {
      log.info('\n');
      log.info(`Processing request : ${request.get('id')}`);
      log.info(`Generated report   : ${request.get('reportType')}`);
      log.info(`Sending report to  : ${request.get('recipients')}`);

      return request.update({
        status: REPORT_REQUEST_STATUSES.PROCESSED,
      });
    });
    return Promise.all(markRequestsAsProcessed);
  }
}
