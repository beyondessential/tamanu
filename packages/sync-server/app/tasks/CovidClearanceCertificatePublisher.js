import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

export class CovidClearanceCertificatePublisher extends ScheduledTask {
  getName() {
    return 'CovidClearanceCertificatePublisher';
  }

  constructor(context) {
    const { schedule } = config.schedules.covidClearanceCertificatePublisher;
    super(schedule, log);
    this.models = context.store.models;
  }

  async run() {

  }
}
