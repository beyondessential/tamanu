import config from 'config';
import moment from 'moment';
import { Op } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';

export class MedicationDiscontinuer extends ScheduledTask {
  getName() {
    return 'MedicationDiscontinuer';
  }

  constructor(context) {
    super(config.schedules.medicationDiscontinuer.schedule, log);
    this.models = context.store.models;

    // Run once on startup (in case the server was down when it was scheduled)
    this.run();
  }

  async run() {
    // Get start of day
    const startOfToday = moment()
      .startOf('day')
      .toDate();

    // Medications that are not discontinued and have an end
    // date (not null) and said end date is previous than today
    const where = {
      discontinued: {
        [Op.not]: true,
      },
      endDate: {
        [Op.and]: [{ [Op.lt]: startOfToday }, { [Op.not]: null }],
      },
    };

    // Count all found medications
    const discontinuableMedicationsCount = await this.models.EncounterMedication.count({ where });

    // Early bail
    if (discontinuableMedicationsCount === 0) {
      log.info('No medications to auto-discontinue. Stopping MedicationDiscontinuer...');
      return;
    }

    // Process in batches
    const {
      batchSize,
      batchSleepAsyncDurationInMilliseconds,
    } = config.schedules.outpatientDischarger;
    const batchCount = Math.ceil(discontinuableMedicationsCount / batchSize);

    log.info(
      `Auto-discontinuing ${discontinuableMedicationsCount} encounter medications in ${batchCount} batches (${batchSize} records per batch)`,
    );

    // Discontinue medications
    for (let i = 0; i < batchCount; i++) {
      const discontinuableMedications = await this.models.EncounterMedication.findAll({
        where,
        limit: batchSize,
      });

      for (const medication of discontinuableMedications) {
        await medication.update({
          discontinued: true,
          discontinuingReason: 'Finished treatment',
        });
        log.info(`Auto-discontinued encounter medication with id ${medication.id}`);
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    log.info('MedicationDiscontinuer finished running');
  }
}
