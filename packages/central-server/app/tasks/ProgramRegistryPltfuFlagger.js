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

    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for ProgramRegistryPltfuFlagger',
      );
    }

    const registries = await this.models.ProgramRegistry.findAll({
      where: { lossToFollowUpEnabled: true },
    });

    if (registries.length === 0) return;

    for (const registry of registries) {
      await this.processRegistry(registry);
    }
  }

  async processRegistry(registry) {
    const pltfuStatus = await this.models.ProgramRegistryClinicalStatus.findOne({
      where: {
        code: { [Op.like]: `%${POTENTIAL_LOSS_TO_FOLLOW_UP.CODE_SUFFIX}%` },
        programRegistryId: registry.id,
      },
    });

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
    let hasMore = true;

    while (hasMore) {
      // Find active registrations where the patient has had no encounter activity
      // within the threshold period and is not already flagged as PLTFU
      const registrationIds = await this.sequelize.query(
        `
        SELECT ppr.patient_id, ppr.program_registry_id
        FROM patient_program_registrations ppr
        WHERE ppr.program_registry_id = :registryId
          AND ppr.registration_status = :activeStatus
          AND (ppr.clinical_status_id IS NULL OR ppr.clinical_status_id != :pltfuStatusId)
          AND NOT EXISTS (
            SELECT 1 FROM encounters e
            WHERE e.patient_id = ppr.patient_id
              AND e.start_date >= :cutoffDate
          )
        LIMIT :batchSize
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

      if (registrationIds.length === 0) {
        hasMore = false;
        break;
      }

      await this.models.PatientProgramRegistration.update(
        { clinicalStatusId: pltfuStatus.id },
        {
          where: {
            [Op.or]: registrationIds.map(({ patient_id, program_registry_id }) => ({
              patientId: patient_id,
              programRegistryId: program_registry_id,
            })),
          },
        },
      );

      totalUpdated += registrationIds.length;

      if (registrationIds.length < batchSize) {
        hasMore = false;
      } else {
        await sleepAsync(batchSleepAsyncDurationInMilliseconds);
      }
    }

    if (totalUpdated > 0) {
      log.info(
        `ProgramRegistryPltfuFlagger: Flagged ${totalUpdated} registrations as LTFU for registry ${registry.code}`,
      );
    }
  }
}
