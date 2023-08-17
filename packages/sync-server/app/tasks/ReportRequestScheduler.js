import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

import { ReportRequest } from 'shared/models';

/**
 * Adds ReportRequests to the queue to be processed
 *
 * Runs on a schedule
 */
export class ReportRequestScheduler extends ScheduledTask {
  getName() {
    return `ReportRequestScheduler for ${this.options.reportType}`;
  }

  constructor(context, options) {
    const { schedule } = options;
    super(schedule, log);
    this.context = context;
    this.options = options;
  }

  async run() {
    const { reportType, recipients, parameters, requestedByUserId } = this.options;

    const newReportRequest = {
      reportType,
      recipients: JSON.stringify(recipients),
      parameters: JSON.stringify(parameters),
      status: REPORT_REQUEST_STATUSES.RECEIVED,
      requestedByUserId,
    };

    await ReportRequest.create(newReportRequest);
  }
}
