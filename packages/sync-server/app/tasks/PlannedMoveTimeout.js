import config from 'config';
import { subHours } from 'date-fns';
import { Op } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';
import {
  getCurrentCountryTimeZoneDateTimeString,
  toCountryDateTimeString,
} from 'shared/utils/dateTime';
import { InvalidConfigError } from 'shared/errors';

export class PlannedMoveTimeout extends ScheduledTask {
  getName() {
    return 'PlannedMoveTimeout';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.plannedMoveTimeout,
      ...overrideConfig,
    };
    super(conf.schedule, log);
    this.config = conf;
    this.models = context.store.models;

    // Run once of startup (in case the server was down when it was scheduled)
    if (!conf.suppressInitialRun) {
      this.runImmediately();
    }
  }

  async run() {
    const { Encounter, Location } = this.models;

    const query = {
      where: {
        plannedLocationStartTime: {
          [Op.lt]: toCountryDateTimeString(subHours(new Date(), this.config.timeoutHours)),
        },
        deletionStatus: null,
      },
      include: [
        {
          model: Location,
          as: 'plannedLocation',
          required: true,
        },
      ],
    };

    const toProcess = await Encounter.count(query);
    if (toProcess === 0) return;

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    // Make sure these exist, else they will prevent the script from working
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for PlannedMoveTimeout',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Running batched timeout of encounter planned moves', {
      recordCount: toProcess,
      batchCount,
      batchSize,
    });

    for (let i = 0; i < batchCount; i++) {
      const encounters = await Encounter.findAll({
        ...query,
        limit: batchSize,
      });

      for (const encounter of encounters) {
        await encounter.addSystemNote(
          `Automatically cancelled planned move to ${encounter.plannedLocation.name} after ${this.config.timeoutHours} hours`,
          getCurrentCountryTimeZoneDateTimeString(),
        );
        await encounter.update({
          plannedLocationId: null,
          plannedLocationStartTime: null,
        });

        log.info('Encounter planned move timeout', { encounterId: encounter.id });
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
