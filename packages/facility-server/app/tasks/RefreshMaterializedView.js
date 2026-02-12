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
        // Set countryTimeZone so CURRENT_DATE in the underlying view resolves correctly
        // for the date-range filter window (±180/730 days). Timezone-sensitive columns
        // (days_till_due, status) are computed at query time per-facility, not stored here.
        await this.sequelize.query(`SET TIME ZONE '${config.countryTimeZone}'`);
        await this.sequelize.query(
          `REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_${snake(this.viewName)}`,
        );
        await this.sequelize.query(`SET TIME ZONE '${this.sequelize.options.timezone}'`);
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
