import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';

export class VRSActionRetrier extends ScheduledTask {
  getName() {
    return 'VRSActionRetrier';
  }

  constructor({ schedules, integrations }) {
    super(schedules.vrsActionRetrier.schedule, log);
    this.vrsIntegration = integrations.fijiVrs;
  }

  async run() {
    await this.vrsIntegration.actionHandler.retryPendingActions();
  }
}
