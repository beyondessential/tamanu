import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';

export class VRSActionRetrier extends ScheduledTask {
  getName() {
    return 'VRSActionRetrier';
  }

  constructor(context) {
    const { retrySchedule, jitterTime, enabled } = config.integrations.fijiVrs;
    super(retrySchedule, log, jitterTime, enabled);
    this.context = context;
  }

  async run() {
    await this.context.integrations.fijiVrs.actionHandler.retryPendingActions();
  }
}
