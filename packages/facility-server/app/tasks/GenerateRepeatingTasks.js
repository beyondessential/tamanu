import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { Op } from 'sequelize';

export class GenerateRepeatingTasks extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.generateRepeatingTasks;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.models;
  }

  getName() {
    return 'GenerateRepeatingTasks';
  }

  getQuery() {
    return {
      where: {
        endTime: null,
        frequencyValue: { [Op.ne]: null },
        frequencyUnit: { [Op.ne]: null },
        parentTaskId: null,
        facilityId: config.serverFacilityId,
      },
    };
  }

  async countQueue() {
    const { Task } = this.models;
    const count = await Task.count(this.getQuery());
    return count;
  }

  async run() {
    const { Task } = this.models;

    const toProcess = await this.countQueue();
    if (toProcess === 0) return;

    const tasks = await Task.findAll({ ...this.getQuery(), include: ['designations'] });

    for (const task of tasks) {
      await Task.generateRepeatingTasks(task);
    }
  }
}
