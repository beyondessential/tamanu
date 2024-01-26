import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';

export class VRSActionRetrier extends ScheduledTask {
  getName() {
    return 'VRSActionRetrier';
  }

  constructor(context) {
    const { schedules } = context;
    const { jitterTime, schedule } = schedules.vrsActionRetrier;
    super(schedule, log, jitterTime);
    this.context = context;
  }

  async run() {
    await this.context.integrations.fijiVrs.actionHandler.retryPendingActions();
  }
}
