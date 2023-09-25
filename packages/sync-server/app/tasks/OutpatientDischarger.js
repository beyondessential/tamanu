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
    const { schedules, settings } = context;
    const { schedule, suppressInitialRun } = {
      ...schedules.outpatientDischarger,
      ...overrideConfig,
    };
    super(schedule, log);
    this.settings = settings;
    this.overrides = overrideConfig;
    this.models = context.store.models;

    // run once on startup (in case the server was down when it was scheduled)
    if (!suppressInitialRun) {
      this.runImmediately();
    }
  }

  async countQueue() {
    const where = getDischargeOutPatientEncountersWhereClause();

    return this.models.Encounter.count({ where });
  }

  async run() {
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = {
      ...(await this.settings.get('schedules.outpatientDischarger')),
      ...this.overrides,
    };

    await dischargeOutpatientEncounters(
      this.models,
      null,
      batchSize,
      batchSleepAsyncDurationInMilliseconds,
    );
  }
}
