import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { MATERIALIZED_VIEWS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { pascal, snake } from 'case';

const RefreshMaterializedTableTask = viewName =>
  class RefreshMaterializedTable extends ScheduledTask {
    viewName = viewName;

    getName() {
      return `Refresh${pascal(this.viewName)}`;
    }

    constructor(context) {
      const { schedule, jitterTime } = config.schedules.refreshMaterializedView[viewName];
      super(schedule, log, jitterTime);
      this.websocketService = context.websocketService;
      this.sequelize = context.sequelize;
      this.models = context.models;
    }

    async run() {
      await this.sequelize.query(
        `REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_${snake(this.viewName)}`,
      );
      this.websocketService.emit(`materialized-view:${this.viewName}:refreshed`);
      await this.models.LocalSystemFact.set(
        `materializedViewLastRefreshedAt:${this.viewName}`,
        getCurrentDateTimeString(),
      );
    }
  };

export const RefreshUpcomingVaccinations = RefreshMaterializedTableTask(
  MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS,
);
