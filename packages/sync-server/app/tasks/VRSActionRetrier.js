import config from 'config';

import { log } from 'shared/services/logging';
import { ScheduledTask } from 'shared/tasks';

export class VRSActionRetrier extends ScheduledTask {
  getName() {
    return 'VRSActionRetrier';
  }

  constructor(context) {
    // TODO: Use db config fetcher (cannot use async on constructor)
    super(config.integrations.fijiVrs.retrySchedule, log);
    this.context = context;
  }

  async run() {
    await this.context.integrations.fijiVrs.actionHandler.retryPendingActions();
  }
}
