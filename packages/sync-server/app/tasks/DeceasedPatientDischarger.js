import config from 'config';
import moment from 'moment';
import { Op } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';

export class DeceasedPatientDischarger extends ScheduledTask {
  getName() {
    return 'DeceasedPatientDischarger';
  }

  constructor(context) {
    this.config = config.schedules.outpatientDischarger;
    super(this.config.schedule, log);
    this.models = context.store.models;
  }

  async run() {
    const { Discharge, Encounter, User } = this.models;
    
    const query = {
      where: {
        endDate: null,
        patient: {
          dateOfDeath: { [Op.not]: null },
        },
      },
      include: ['patient'],
    };

    const toProcess = await Encounter.count(query);
    if (toProcess === 0) return;

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config.batchSize;
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

        /* SELECT u.*
        FROM users u
        JOIN dicharges d ON d.discharger_id = u.id
        JOIN encounters e ON e.id = d.encounter_id
        WHERE e.patient_id = P AND e.end_date = D
        */

        const discharger = User.findOne({
          where: {
            '$encounter.patient_id$': patient.id,
            '$encounter.end_date$': patient.dateOfDeath,
          },
          include: [{
            model: Discharge,
            as: 'discharges',
            include: [{
              model: Encounter,
              as: 'encounter',
            }],
          }]
        });

        await encounter.dischargeWithDischarger(discharger, patient.dateOfDeath);
        log.info(`Auto-closed encounter with id ${encounter.id} (discharger=${discharger.id}, dod=${patient.dateOfDeath})`);
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    log.info('DeceasedPatientDischarger finished running');
  }
}
