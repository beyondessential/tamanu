import config from 'config';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/shared/utils';
import { InvalidConfigError } from '@tamanu/shared/errors';

export class DeceasedPatientDischarger extends ScheduledTask {
  getName() {
    return 'DeceasedPatientDischarger';
  }

  constructor(context) {
    const conf = config.schedules.deceasedPatientDischarger;
    super(conf.schedule, log);
    this.config = conf;
    this.models = context.store.models;
  }

  async run() {
    const { Encounter, Patient } = this.models;

    const query = {
      where: {
        endDate: null,
        '$patient.date_of_death$': { [Op.not]: null },
      },
      include: [
        {
          model: Patient,
          as: 'patient',
        },
      ],
    };

    const toProcess = await Encounter.count(query);
    if (toProcess === 0) return;

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    // Make sure these exist, else they will prevent the script from working
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for DeceasedPatientDischarger',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info(
      `Auto-discharging ${toProcess} encounters for deceased patients in ${batchCount} batches (${batchSize} records per batch)`,
    );

    for (let i = 0; i < batchCount; i++) {
      const encounters = await Encounter.findAll({
        ...query,
        limit: batchSize,
      });

      for (const encounter of encounters) {
        const patient = await encounter.getPatient();
        if (!patient.dateOfDeath) {
          log.warn(`Deceased patient ${patient.id} not actually deceased! Skipping...`);
          continue;
        }

        const [patientDeathData] = await patient.getDeathData();

        if (!patientDeathData) {
          log.warn(`Deceased patient ${patient.id} has no death data! Skipping...`);
          continue;
        }

        const discharger = await patientDeathData.getClinician();
        await encounter.update({
          endDate: patient.dateOfDeath,
          systemNote: 'Automatically discharged',
          discharge: {
            dischargerId: discharger.id,
            note: 'Automatically discharged by deceased patient discharger',
          },
        });
        log.info(
          `Auto-closed encounter with id ${encounter.id} (discharger=${discharger.id}, dod=${patient.dateOfDeath})`,
        );
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
