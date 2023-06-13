import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import {
  dischargeOutpatientEncounters,
  getDischargeOutPatientEncountersWhereClause,
} from 'shared/utils';

// As well as the sync import auto-discharging old encounters on the way in, we also need a daily
// task to clean up any that synced in on the same day as they were created
export class OutpatientDischarger extends ScheduledTask {
  getName() {
    return 'OutpatientDischarger';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.outpatientDischarger,
      ...overrideConfig,
    };
    super(conf.schedule, log);
    this.config = conf;
    this.models = context.store.models;

    // run once on startup (in case the server was down when it was scheduled)
    if (!conf.suppressInitialRun) {
      this.runImmediately();
    }
  }

  async countQueue() {
    const where = getDischargeOutPatientEncountersWhereClause();

    return this.models.Encounter.count({ where });
  }

  async run() {
    const {
      batchSize,
      batchSleepAsyncDurationInMilliseconds,
    } = config.schedules.outpatientDischarger;

    await dischargeOutpatientEncounters(
      this.models,
      null,
      batchSize,
      batchSleepAsyncDurationInMilliseconds,
    );
  }
}
