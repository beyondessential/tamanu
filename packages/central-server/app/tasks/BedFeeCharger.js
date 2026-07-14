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
import { InvalidConfigError } from '.';

/**
 * Recompute the per-night bed fee for every currently-admitted patient.
 *
 * The recompute is idempotent (it counts the facility-local overnight checks that have occurred
 * up to now), so this can run frequently — running hourly just means a new night lands within an
 * hour of each facility's local overnight-check time. No per-facility scheduling is needed.
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
    this.models = context.store.models;
    this.sequelize = context.store.sequelize;
  }

  async run() {
    const { Encounter, Location, Invoice } = this.models;
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for BedFeeCharger',
      );
    }

    // Recompute still-admitted patients, plus recently-discharged ones, so the final discharge-day
    // night is captured even for off-hour check times and death discharges (recompute is idempotent).
    const dischargedSince = toDateTimeString(sub(new Date(), { hours: 25 }));
    const query = {
      where: {
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: dischargedSince } }],
      },
      include: [{ model: Location, as: 'location', attributes: ['facilityId'] }],
    };

    const toProcess = await Encounter.count({ where: query.where });
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
          // Managed transaction (CLS) so each encounter's multi-write recompute is atomic, and
          // a failure on one encounter (e.g. bad invoice data) doesn't starve the rest.
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
