import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { MATERIALIZED_TABLES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { pascal, snake } from 'case';

const RefreshMaterializedViewTask = tableName =>
  class RefreshMaterializedView extends ScheduledTask {
    tableName = tableName;

    getName() {
      return `Refresh${pascal(this.tableName)}`;
    }

    constructor(context) {
      const { schedule, jitterTime } = config.schedules.refreshMaterializedView[tableName];
      super(schedule, log, jitterTime);
      this.websocketService = context.websocketService;
      this.sequelize = context.sequelize;
      this.models = context.models;
      this.runImmediately();
    }

    async run() {
      await this.sequelize.query(
        `REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_${snake(this.tableName)}`,
      );
      await this.sequelize.query(`NOTIFY refreshed_materialized_view, '${this.tableName}'`);
      await this.models.LocalSystemFact.set(
        `materializedViewLastRefreshedAt:${this.tableName}`,
        getCurrentDateTimeString(),
      );
    }
  };

export const RefreshUpcomingVaccinations = RefreshMaterializedViewTask(
  MATERIALIZED_TABLES.UPCOMING_VACCINATIONS,
);
