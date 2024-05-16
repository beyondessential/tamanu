import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { LAST_REFRESHED_UPCOMING_VACCINATIONS_KEY } from '@tamanu/constants/vaccines';
import { log } from '@tamanu/shared/services/logging';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

export class RefreshUpcomingVaccinations extends ScheduledTask {
  getName() {
    return 'RefreshUpcomingVaccinations';
  }

  constructor(context) {
    const { schedule, jitterTime } = config.sync;
    super(schedule, log, jitterTime);
    this.sequelize = context.sequelize;
    this.models = context.models;
    this.runImmediately();
  }

  async run() {
    await this.sequelize.query('REFRESH MATERIALIZED VIEW materialized_upcoming_vaccinations');
    await this.models.LocalSystemFact.set(
      LAST_REFRESHED_UPCOMING_VACCINATIONS_KEY,
      getCurrentDateTimeString(),
    );
  }
}
