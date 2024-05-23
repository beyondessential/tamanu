import config from 'config';
import { pascal, snake } from 'case';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { MATERIALIZED_VIEWS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

const buildRefreshMaterializedViewTask = viewName =>
  class RefreshMaterializedView extends ScheduledTask {
    viewName = viewName;

    getName() {
      return `Refresh${pascal(this.viewName)}`;
    }

    constructor(context) {
      const { schedule, jitterTime } = config.schedules.refreshMaterializedView[viewName];
      super(schedule, log, jitterTime);
      this.sequelize = context.sequelize;
      this.models = context.models;
      this.runImmediately();
    }

    async run() {
      await this.sequelize.query(
        `REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_${snake(this.viewName)}`,
      );
      await this.models.LocalSystemFact.set(
        `materializedViewLastRefreshedAt:${this.viewName}`,
        getCurrentDateTimeString(),
      );
      await this.sequelize.query(`NOTIFY refreshed_materialized_view, '${this.viewName}'`);
    }
  };

export const RefreshUpcomingVaccinations = buildRefreshMaterializedViewTask(
  MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS,
);
