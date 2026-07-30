import {
  countMissingReportingGrants,
  refreshReportingGrants,
} from '@tamanu/database/services/reporting';

import { log } from '../services/logging';
import { ScheduledTask } from './ScheduledTask';

export class ReportingGrantsRefresher extends ScheduledTask {
  getName() {
    return 'ReportingGrantsRefresher';
  }

  constructor(context) {
    // schedules is settings-resolved before task startup on both server types
    const { schedule, jitterTime, enabled } = context.schedules?.reportingGrantsRefresher ?? {};
    super(schedule, log, jitterTime, enabled);
    this.store = context.store;
  }

  async countQueue() {
    return countMissingReportingGrants(this.store);
  }

  async run() {
    await refreshReportingGrants(this.store);
  }
}
