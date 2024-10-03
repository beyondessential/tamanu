import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { Op } from 'sequelize';
import { sleepAsync } from '@tamanu/shared/utils';
import { InvalidConfigError } from '@tamanu/shared/errors';
import {
  REFERENCE_TYPES,
  SYSTEM_USER_UUID,
  TASK_OVERDUE_REASON_ID,
  TASK_STATUSES,
} from '@tamanu/constants';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/shared/utils/dateTime';

const MILLISECONDS_PER_DAY = 86400000;

export class GenerateRepeatingTasks extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.generateRepeatingTasks;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
    this.config = conf;
    this.sequelize = context.store.sequelize;
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
    await this.removeChildTasksOverParentEndtime();
    await this.markOldRepeatingTasksAsNotCompleted();
    await this.generateChildTasks();
  }

  // remove child tasks that have dueTime over parent endtime
  // this is a safe guard for the delayed sync from facility server to central server
  // only need to account for tasks that have been created in the last 30 days with the status of TODO
  async removeChildTasksOverParentEndtime() {
    await this.sequelize.query(
      `update tasks set deleted_at = now() where id in (SELECT childTasks.id FROM tasks as childTasks
    JOIN tasks as parentTasks
      ON parentTasks.id = childTasks.parent_task_id
      AND parentTasks.end_time IS NOT NULL
    WHERE childTasks.deleted_at is NULL
      and childTasks.due_time > parentTasks.end_time
      and childTasks.status IN (:statuses)
      and childTasks.created_at > now() - interval '30' day)`,
      {
        replacements: {
          statuses: [TASK_STATUSES.TODO],
        },
      },
    );
  }

  async markOldRepeatingTasksAsNotCompleted() {
    const { Task, ReferenceData } = this.models;
    const notCompletedReason = await ReferenceData.findOne({
      where: { id: TASK_OVERDUE_REASON_ID, code: REFERENCE_TYPES.TASK_NOT_COMPLETED_REASON },
    });

    // 2 days ago
    const cutoffDateTime = new Date(new Date().getTime() - 2 * MILLISECONDS_PER_DAY);

    await Task.update(
      {
        status: TASK_STATUSES.NON_COMPLETED,
        notCompletedByUserId: SYSTEM_USER_UUID,
        notCompletedTime: getCurrentDateTimeString(),
        notCompletedReasonId: notCompletedReason?.id || null,
      },
      {
        where: {
          status: TASK_STATUSES.TODO,
          frequencyValue: { [Op.not]: null },
          frequencyUnit: { [Op.not]: null },
          dueTime: { [Op.lt]: toDateTimeString(cutoffDateTime) },
        },
      },
    );
  }

  //generate child tasks for repeating tasks
  async generateChildTasks() {
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
