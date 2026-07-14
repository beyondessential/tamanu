import config from 'config';
import { Op } from 'sequelize';
import { sub } from 'date-fns';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { ReadSettings } from '@tamanu/settings';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

import { getServerFacilityIds } from '../serverConfig';

class InvalidConfigError extends Error {}

/**
 * Recompute the per-night bed fee for every currently-admitted patient at this server's
 * facilities.
 */
export class BedFeeCharger extends ScheduledTask {
  getName() {
    return 'BedFeeCharger';
  }

  constructor(context) {
    const conf = config.schedules.bedFeeCharger;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.models = context.models;
    this.sequelize = context.sequelize;
  }

  async run() {
    const { Encounter, Location, Invoice } = this.models;
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for BedFeeCharger',
      );
    }

    const serverFacilityIds = getServerFacilityIds() ?? [];
    if (serverFacilityIds.length === 0) {
      log.warn('BedFeeCharger: no facility configured yet, skipping');
      return;
    }

    // Recompute still-admitted patients, plus recently-discharged ones, so the final discharge-day
    // night is captured even for off-hour check times and death discharges (recompute is
    // idempotent). Scope to this server's own facilities so a synced-in encounter belonging to
    // another facility isn't charged here (that facility's own server owns it).
    const dischargedSince = toDateTimeString(sub(new Date(), { hours: 25 }));
    const query = {
      where: {
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: dischargedSince } }],
      },
      include: [
        {
          model: Location,
          as: 'location',
          required: true,
          where: { facilityId: serverFacilityIds },
          attributes: ['facilityId'],
        },
      ],
    };

    const toProcess = await Encounter.count({ ...query, distinct: true, col: 'id' });
    if (toProcess === 0) return;

    const primaryTimeZone = getPrimaryTimeZone(config);
    const settingsByFacility = new Map();
    const getSettings = facilityId => {
      if (!settingsByFacility.has(facilityId)) {
        settingsByFacility.set(facilityId, new ReadSettings(this.models, facilityId));
      }
      return settingsByFacility.get(facilityId);
    };

    const batchCount = Math.ceil(toProcess / batchSize);
    log.info(`Recomputing bed fees for ${toProcess} admitted encounters in ${batchCount} batches`);

    // The admitted set doesn't change during the run (recompute touches invoice items only),
    // so offset pagination is stable.
    for (let i = 0; i < batchCount; i++) {
      const encounters = await Encounter.findAll({
        ...query,
        limit: batchSize,
        offset: i * batchSize,
      });

      for (const encounter of encounters) {
        const facilityId = encounter.location?.facilityId;
        if (!facilityId) continue;
        try {
          await this.sequelize.transaction(() =>
            Invoice.recalculateBedFee(encounter, getSettings(facilityId), primaryTimeZone),
          );
        } catch (error) {
          log.error('BedFeeCharger: failed to recalculate bed fee', {
            encounterId: encounter.id,
            error: error.stack,
          });
        }
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
