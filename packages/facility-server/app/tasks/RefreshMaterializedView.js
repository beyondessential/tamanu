import config from 'config';
import { pascal, snake } from 'case';

import { ScheduledTask } from '@tamanu/shared/tasks';
import {
  MATERIALIZED_VIEWS,
  MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE,
  NOTIFY_CHANNELS,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

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
      await this.sequelize.transaction(async () => {
        // Set timezone to country timezone this is because sequelize timezone is defaulted to UTC currently
        await this.sequelize.query(`SET TIME ZONE '${config.countryTimeZone}'`);
        await this.sequelize.query(
          `REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_${snake(this.viewName)}`,
          { timezone: config.countryTimeZone },
        );
        await this.sequelize.query(`SET TIME ZONE '${this.sequelize.options.timezone}'`); // Revert to sequelize timezone
        await this.sequelize.query(`NOTIFY ${NOTIFY_CHANNELS.DATA_UPDATED}, '${this.viewName}'`);
      });
      await this.models.LocalSystemFact.set(
        `${MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE}:${this.viewName}`,
        new Date().toISOString(),
      );
    }
  };

export const RefreshUpcomingVaccinations = buildRefreshMaterializedViewTask(
  MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS,
);
