import config from 'config';
import { pascal, snake } from 'case';

import { ScheduledTask } from '@tamanu/shared/tasks';
import {
  MATERIALIZED_VIEWS,
  MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE,
  NOTIFY_CHANNELS,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getCurrentISO8601DateString } from '@tamanu/utils/dateTime';

const buildRefreshMaterializedViewTask = viewName =>
  class RefreshMaterializedView extends ScheduledTask {
    viewName = viewName;

    getName() {
      return `Refresh${pascal(this.viewName)}`;
    }

    constructor(context) {
      const { schedule, jitterTime, enabled } = config.schedules.refreshMaterializedView[viewName];
      super(schedule, log, jitterTime, enabled);
      this.sequelize = context.sequelize;
      this.models = context.models;
      this.runImmediately();
    }

    async run() {
      await this.sequelize.transaction(async () => {
        // Set timezone to primary timezone this is because sequelize timezone is defaulted to UTC currently
        await this.sequelize.query(`SET TIME ZONE '${config.primaryTimeZone}'`);
        await this.sequelize.query(
          `REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_${snake(this.viewName)}`,
          { timezone: config.primaryTimeZone },
        );
        await this.sequelize.query(`SET TIME ZONE '${this.sequelize.options.timezone}'`); // Revert to sequelize timezone
        await this.sequelize.query(
          `NOTIFY ${NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED}, '${this.viewName}'`,
        );
      });
      await this.models.LocalSystemFact.set(
        `${MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE}:${this.viewName}`,
        getCurrentISO8601DateString(),
      );
    }
  };

export const RefreshUpcomingVaccinations = buildRefreshMaterializedViewTask(
  MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS,
);
