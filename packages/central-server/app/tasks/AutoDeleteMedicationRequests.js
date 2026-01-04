import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { Op } from 'sequelize';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { InvalidConfigError } from '.';
import { toDateTimeString } from '@tamanu/utils/dateTime';

export class AutoDeleteMedicationRequests extends ScheduledTask {
  /**
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.autoDeleteMedicationRequests;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
    this.config = conf;
    this.sequelize = context.store.sequelize;
    this.settings = context.settings;
  }

  getName() {
    return 'AutoDeleteMedicationRequests';
  }

  async run() {
    const { PharmacyOrderPrescription } = this.models;

    // Get the auto-delete timeframe setting (in hours)
    const autoDeleteTimeframeHours =
      (await this.settings.get('medications.dispensing.autoDeleteTimeframeHours')) ?? 72;
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for AutoDeleteMedicationRequests',
      );
    }

    // Calculate cutoff date (current time - autoDeleteTimeframeHours)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - autoDeleteTimeframeHours);
    const cutoffDateTime = toDateTimeString(cutoffDate);

    const query = {
      include: [
        {
          association: 'pharmacyOrder',
          attributes: ['id', 'date'],
          where: {
            date: { [Op.lt]: cutoffDateTime },
          },
          required: true,
        },
      ],
      where: {
        // Use a subquery to filter for prescriptions with no dispenses at the database level
        [Op.and]: [
          this.sequelize.literal(`(
            SELECT COUNT(*)
            FROM "medication_dispenses"
            WHERE "medication_dispenses"."pharmacy_order_prescription_id" = "PharmacyOrderPrescription"."id"
            AND "medication_dispenses"."deleted_at" IS NULL
          ) = 0`),
        ],
      },
    };

    // Count total records to process
    const toProcess = await PharmacyOrderPrescription.count(query);
    if (toProcess === 0) {
      log.info('No medication requests to auto-delete');
      return;
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Running batched auto-deletion of medication requests', {
      recordCount: toProcess,
      batchCount,
      batchSize,
      cutoffDateTime,
      autoDeleteTimeframeHours,
    });

    for (let i = 0; i < batchCount; i++) {
      // Find medication requests that:
      // 1. Are not deleted
      // 2. Were created before the cutoff date
      // 3. Have no dispenses
      const pharmacyOrderPrescriptionsToProcess = await PharmacyOrderPrescription.findAll({
        ...query,
        attributes: ['id'],
        limit: batchSize,
      });

      const idsToDelete = pharmacyOrderPrescriptionsToProcess.map(p => p.id);

      if (idsToDelete.length > 0) {
        // Soft delete the medication requests
        await PharmacyOrderPrescription.destroy({
          where: {
            id: { [Op.in]: idsToDelete },
          },
          individualHooks: true,
        });

        log.info(
          `Auto-deleted ${idsToDelete.length} medication requests in batch ${i + 1}/${batchCount}`,
        );
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    log.info('Completed auto-deletion of medication requests', {
      totalDeleted: toProcess,
    });
  }
}
