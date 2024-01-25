import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';

export class VRSActionRetrier extends ScheduledTask {
  getName() {
    return 'VRSActionRetrier';
  }

  constructor(context) {
    const { schedules } = context;
    const { jitterTime } = config.integrations.fijiVrs;
    super(schedules.vrsActionRetrier.schedules, log, jitterTime);
    this.context = context;
  }

  async run() {
    await this.vrsIntegration.actionHandler.retryPendingActions();
  }
}
