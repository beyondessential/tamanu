import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

export class PatientMergeMaintainer extends ScheduledTask {
  getName() {
    return 'PatientMergeMaintainer';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.patientMergeMaintainer,
      ...overrideConfig,
    };
    super(conf.schedule, log);
    this.config = conf;
    this.models = context.store.models;
  }

  async countQueue() {
    return 0;
  }

  async run() {
    // get which models have a patient merge aspect?
    const sql = `
      SELECT ${table}.id
      FROM ${table}
      JOIN patients ON patients.id = ${table}.patient_id
      WHERE patients.merged_into_id IS NOT NULL
    `;

    log.info('PatientMergeMaintainer finished running');
  }
}
