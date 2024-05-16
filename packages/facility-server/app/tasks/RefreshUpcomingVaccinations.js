import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class RefreshUpcomingVaccinations extends ScheduledTask {
  getName() {
    return 'RefreshUpcomingVaccinations';
  }

  constructor(context) {
    const { schedule, jitterTime } = config.sync;
    super(schedule, log, jitterTime);
    this.sequelize = context.sequelize;
    this.runImmediately();
  }

  async run() {
    return this.sequelize.query('REFRESH MATERIALIZED VIEW materialized_upcoming_vaccinations');
  }
}
