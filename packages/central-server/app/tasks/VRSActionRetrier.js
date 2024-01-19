import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';

export class VRSActionRetrier extends ScheduledTask {
  getName() {
    return 'VRSActionRetrier';
  }

  constructor(context) {
    const { retrySchedule, jitterMs } = config.integrations.fijiVrs;
    super(retrySchedule, log, jitterMs);
    this.context = context;
  }

  async run() {
    await this.context.integrations.fijiVrs.actionHandler.retryPendingActions();
  }
}
