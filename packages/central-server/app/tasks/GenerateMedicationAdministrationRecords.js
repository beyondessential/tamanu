import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { Op } from 'sequelize';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { InvalidConfigError } from '@tamanu/shared/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

export class GenerateMedicationAdministrationRecords extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.generateMedicationAdministrationRecords;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
    this.config = conf;
    this.sequelize = context.store.sequelize;
  }

  getName() {
    return 'GenerateMedicationAdministrationRecords';
  }

  async run() {
    await this.generateMedicationAdministrationRecords();
  }

  async generateMedicationAdministrationRecords() {
    const { Prescription, MedicationAdministrationRecord } = this.models;
    const baseQueryOptions = {
      where: {
        endDate: { [Op.gt]: getCurrentDateTimeString() },
        [Op.or]: [
          { discontinuedDate: { [Op.gt]: getCurrentDateTimeString() } },
          { discontinuedDate: null },
        ],
      },
    };

    const toProcess = await Prescription.count({
      ...baseQueryOptions,
    });

    if (toProcess === 0) return;

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for GenerateMedicationAdministrationRecords',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Running batched generating medication administration records', {
      recordCount: toProcess,
      batchCount,
      batchSize,
    });

    for (let i = 0; i < batchCount; i++) {
      const prescriptions = await Prescription.findAll({
        ...baseQueryOptions,
        limit: batchSize,
      });

      for (const prescription of prescriptions) {
        const abc =
          await MedicationAdministrationRecord.generateMedicationAdministrationRecords(
            prescription,
          );
        console.log('abc', abc);
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
