import config from 'config';
import { COMMUNICATION_STATUSES, PATIENT_COMMUNICATION_CHANNELS } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { InvalidConfigError } from '@tamanu/shared/errors';
import { sleepAsync } from '@tamanu/shared/utils';

export class PatientTelegramCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.patientTelegramCommunicationProcessor;
    const { schedule, jitterTime } = conf;
    super(schedule, log, jitterTime);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'PatientTelegramCommunicationProcessor';
  }

  async countQueue() {
    const { PatientCommunication } = this.context.store.models;
    return PatientCommunication.count({
      where: {
        status: COMMUNICATION_STATUSES.QUEUED,
        channel: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
      },
    });
  }

  async run() {
    const { PatientCommunication } = this.context.store.models;

    const query = {
      where: {
        status: COMMUNICATION_STATUSES.QUEUED,
        channel: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
      },
      order: [['createdAt', 'ASC']], // process in order received
    };

    const toProcess = await PatientCommunication.count(query);
    if (toProcess === 0) return;

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    // Make sure these exist, else they will prevent the script from working
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for PatientTelegramCommunicationProcessor',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Running batched sending reminder message to patient via telegram', {
      recordCount: toProcess,
      batchCount,
      batchSize,
    });

    for (let i = 0; i < batchCount; i++) {
      const communications = await PatientCommunication.findAll({
        ...query,
        limit: batchSize,
      });

      for (const communication of communications) {
        const plainCommunication = communication.get({ plain: true });
        try {
          const result = await this.context.telegramBotService.sendMessage(
            plainCommunication.destination,
            communication.content,
          );
          if (result.error) {
            log.error('Sending message via telegram failed', {
              communicationId: plainCommunication.id,
              error: result.error,
            });
          }
          await communication.update({
            status: result.status,
            error: result.error,
          });
        } catch (e) {
          log.error('Sending message via telegram failed', {
            communicationId: plainCommunication.id,
            error: e.stack,
          });
          await communication.update({
            status: COMMUNICATION_STATUSES.ERROR,
            error: e.message,
          });
        }
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
