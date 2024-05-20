import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { UPCOMING_VACCINATIONS_REFRESHED_AT_KEY, WS_EVENTS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

export class RefreshUpcomingVaccinations extends ScheduledTask {
  getName() {
    return 'RefreshUpcomingVaccinations';
  }

  constructor(context) {
    const { schedule, jitterTime } = config.schedules.refreshUpcomingVaccinations;
    super(schedule, log, jitterTime);
    this.websocketService = context.websocketService;
    this.sequelize = context.sequelize;
    this.models = context.models;
  }

  async run() {
    await this.sequelize.query(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_upcoming_vaccinations',
    );
    this.websocketService.emit(WS_EVENTS.UPCOMING_VACCINATIONS_REFRESHED);
    await this.models.LocalSystemFact.set(
      UPCOMING_VACCINATIONS_REFRESHED_AT_KEY,
      getCurrentDateTimeString(),
    );
  }
}
