import config from 'config';
import { pascal, snake } from 'case';

import { ScheduledTask } from '@tamanu/shared/tasks';
import {
  MATERIALIZED_VIEWS,
  MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE,
  NOTIFY_CHANNELS,
} from '@tamanu/constants';
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
        `${MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE}:${this.viewName}`,
        getCurrentDateTimeString(),
      );
      await this.sequelize.query(`NOTIFY ${NOTIFY_CHANNELS.DATA_UPDATED}, '${this.viewName}'`);
    }
  };

export const RefreshUpcomingVaccinations = buildRefreshMaterializedViewTask(
  MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS,
);
