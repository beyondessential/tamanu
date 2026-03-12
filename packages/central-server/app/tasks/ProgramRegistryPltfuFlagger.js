import config from 'config';
import { Op, QueryTypes } from 'sequelize';
import { subDays } from 'date-fns';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { POTENTIAL_LOSS_TO_FOLLOW_UP, REGISTRATION_STATUSES } from '@tamanu/constants';

import { InvalidConfigError } from '.';

// PLTFU = Potential Loss To Follow Up (clinical status)
export class ProgramRegistryPltfuFlagger extends ScheduledTask {
  getName() {
    return 'ProgramRegistryPltfuFlagger';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.programRegistryPltfuFlagger,
      ...overrideConfig,
    };
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.models = context.store.models;
    this.sequelize = context.store.sequelize;
  }

  async run() {
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!batchSize || batchSleepAsyncDurationInMilliseconds == null) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for ProgramRegistryPltfuFlagger',
      );
    }

    const registries = await this.models.ProgramRegistry.findAll({
      where: { lossToFollowUpEnabled: true },
    });

    if (registries.length === 0) return;

    const registryIds = registries.map(r => r.id);
    const pltfuCodes = registries.map(
      r => `${r.code}-${POTENTIAL_LOSS_TO_FOLLOW_UP.CODE_SUFFIX}`,
    );
    const pltfuStatuses = await this.models.ProgramRegistryClinicalStatus.findAll({
      where: {
        programRegistryId: { [Op.in]: registryIds },
        code: { [Op.in]: pltfuCodes },
      },
    });
    const pltfuByRegistryId = new Map(
      pltfuStatuses.map(s => [s.programRegistryId, s]),
    );

    for (const registry of registries) {
      await this.processRegistry(registry, pltfuByRegistryId.get(registry.id));
    }
  }

  async processRegistry(registry, pltfuStatus) {
    if (!pltfuStatus) {
      log.warn(
        `ProgramRegistryPltfuFlagger: No LTFU clinical status found for registry ${registry.code}. ` +
          'Re-import the program registry to auto-create it.',
      );
      return;
    }

    const thresholdDays = registry.lossToFollowUpThresholdDays;
    const cutoffDate = toDateTimeString(subDays(new Date(), thresholdDays));
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    let totalUpdated = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Find active registrations where the patient has had no encounter activity
      // within the threshold period and is not already flagged as PLTFU, then update them to PLTFU.
      const updatedRegistrations = await this.sequelize.query(
        `
          WITH registrations_to_flag AS (
            SELECT ppr.patient_id, ppr.program_registry_id
            FROM patient_program_registrations ppr
            WHERE ppr.program_registry_id = :registryId
              AND ppr.registration_status = :activeStatus
              AND (ppr.clinical_status_id IS NULL OR ppr.clinical_status_id != :pltfuStatusId)
              AND NOT EXISTS (
                SELECT 1 FROM encounters e
                WHERE e.patient_id = ppr.patient_id
                  AND e.start_date >= :cutoffDate
                  AND e.deleted_at IS NULL
              )
            LIMIT :batchSize
          )
          UPDATE patient_program_registrations ppr
          SET clinical_status_id = :pltfuStatusId, updated_at = CURRENT_TIMESTAMP
          FROM registrations_to_flag rtf
          WHERE ppr.patient_id = rtf.patient_id
            AND ppr.program_registry_id = rtf.program_registry_id
          RETURNING ppr.patient_id
          `,
        {
          replacements: {
            registryId: registry.id,
            activeStatus: REGISTRATION_STATUSES.ACTIVE,
            pltfuStatusId: pltfuStatus.id,
            cutoffDate,
            batchSize,
          },
          type: QueryTypes.SELECT,
        },
      );

      const batchCount = updatedRegistrations.length;

      if (batchCount === 0) {
        break;
      }

      totalUpdated += batchCount;

      if (batchCount < batchSize) {
        break;
      }
      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    if (totalUpdated > 0) {
      log.info(
        `ProgramRegistryPltfuFlagger: Flagged ${totalUpdated} registrations as LTFU for registry ${registry.code}`,
      );
    }
  }
}
