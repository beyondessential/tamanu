import { subHours } from 'date-fns';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/shared/utils';
import {
  getCurrentCountryTimeZoneDateTimeString,
  toCountryDateTimeString,
} from '@tamanu/shared/utils/countryDateTime';
import { InvalidConfigError } from '@tamanu/shared/errors';

export class PlannedMoveTimeout extends ScheduledTask {
  getName() {
    return 'PlannedMoveTimeout';
  }

  constructor(context, overrideConfig = null) {
    const { store, settings, schedules } = context;
    const { schedule, jitterTime, suppressInitialRun } = {
      ...schedules.plannedMoveTimeout,
      ...overrideConfig,
    };
    super(schedule, log, jitterTime);
    this.overrides = overrideConfig;
    this.models = store.models;
    this.settings = settings;

    // Run once of startup (in case the server was down when it was scheduled)
    if (!suppressInitialRun) {
      this.runImmediately();
    }
  }

  async run() {
    const { Encounter, Location } = this.models;

    const timeoutHours =
      this.overrides?.timeoutHours ||
      (await this.settings.get('schedules.plannedMoveTimeout.timeoutHours'));

    const query = {
      where: {
        plannedLocationStartTime: {
          [Op.lt]: toCountryDateTimeString(subHours(new Date(), timeoutHours)),
        },
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

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = {
      ...(await this.settings.get('schedules.plannedMoveTimeout')),
      ...this.overrides,
    };

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
          `Automatically cancelled planned move to ${encounter.plannedLocation.name} after ${timeoutHours} hours`,
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
