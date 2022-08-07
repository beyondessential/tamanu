import config from 'config';

import { subDays } from 'date-fns';
import { Op } from 'sequelize';
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
    const {
      after,
      labTestCategories,
      labTestTypes,
    } = config.schedules.covidClearanceCertificatePublisher;
    const { LabRequest, LabTest } = this.models;
    // Get lab requests before the last 13 days with the
    // lab test categories configured
    const requests = await LabRequest.findAll({
      where: {
        sampleTime: {
          [Op.lt]: subDays(new Date(), 13),
          [Op.gt]: after,
        },
        labTestCategoryId: {
          [Op.in]: labTestCategories,
        },
        '$tests.lab_test_type_id$': {
          [Op.in]: labTestTypes,
        },
      },
      include: [
        {
          model: LabTest,
          as: 'tests',
          required: true,
        },
      ],
    });
  }
}
