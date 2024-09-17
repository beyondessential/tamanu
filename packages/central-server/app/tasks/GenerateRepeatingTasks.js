import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { Op } from 'sequelize';
import { sleepAsync } from '@tamanu/shared/utils';

export class GenerateRepeatingTasks extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.generateRepeatingTasks;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
    this.config = conf;
  }

  getName() {
    return 'GenerateRepeatingTasks';
  }

  getQuery() {
    return {
      where: {
        endTime: null,
        frequencyValue: { [Op.not]: null },
        frequencyUnit: { [Op.not]: null },
        parentTaskId: null,
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

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for GenerateRepeatingTasks',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Running batched generating repeating tasks', {
      recordCount: toProcess,
      batchCount,
      batchSize,
    });

    for (let i = 0; i < batchCount; i++) {
      const tasks = await Task.findAll({
        ...this.getQuery(),
        include: ['designations'],
        limit: batchSize,
      });

      await Task.generateRepeatingTasks(tasks);

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
