import config from 'config';
import { Op } from 'sequelize';
import { toDateString } from '@tamanu/utils/dateTime';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { InvalidConfigError } from '@tamanu/shared/errors';
import { log } from '@tamanu/shared/services/logging';

export class GenerateRepeatingLocationAssignments extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.generateRepeatingLocationAssignments;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
    this.config = conf;
    this.sequelize = context.store.sequelize;
    this.settings = context.settings;
  }

  getName() {
    return 'GenerateRepeatingLocationAssignments';
  }

  async run() {
    const { LocationAssignmentTemplate } = this.models;

    const baseQueryOptions = {
      where: {
        [Op.or]: [
          { repeatEndDate: null },
          { repeatEndDate: { [Op.gte]: toDateString(new Date()) } },
        ],
      },
    };

    const toProcess = await LocationAssignmentTemplate.count({
      ...baseQueryOptions,
    });

    if (toProcess === 0) {
      this.log.info('No incomplete location assignment templates found within time frame');
      return;
    }

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for GenerateRepeatingLocationAssignments',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Running batched generating location assignment templates', {
      recordCount: toProcess,
      batchCount,
      batchSize,
    });

    for (let i = 0; i < batchCount; i++) {
      const templates = await LocationAssignmentTemplate.findAll({
        ...baseQueryOptions,
        limit: batchSize,
        offset: i * batchSize,
      });
      
      const promises = templates.map(async (template) => {
        try {
          await this.sequelize.transaction(async () => {
            await template.generateRepeatingLocationAssignments(this.settings);
          });
        } catch (error) {
          log.error('Failed to generate repeating location assignments', {
            templateId: template.id,
            error: error.message,
          });
        }
      });

      await Promise.all(promises);
      
      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
} 