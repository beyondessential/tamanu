import config from 'config';
import { PATIENT_COMMUNICATION_CHANNELS } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { InvalidConfigError } from '.';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

export class PatientTelegramCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.patientTelegramCommunicationProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'PatientTelegramCommunicationProcessor';
  }

  async countQueue() {
    const { PatientCommunication } = this.context.store.models;
    return PatientCommunication.countPendingMessages(PATIENT_COMMUNICATION_CHANNELS.TELEGRAM);
  }

  async run() {
    const { PatientCommunication } = this.context.store.models;

    const toProcess = await this.countQueue();
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
      const communications = await PatientCommunication.getPendingMessages(
        PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
        { limit: batchSize },
      );

      for (const communication of communications) {
        const plainCommunication = communication.get({ plain: true });
        const result = await this.context.telegramBotService.sendMessage(
          plainCommunication.destination,
          communication.content,
        );

        if (result.error) {
          log.error('Sending message via telegram failed', {
            communicationId: plainCommunication.id,
            error: result.error,
          });
          if (result.shouldRetry) {
            await communication.update({
              retryCount: plainCommunication.retryCount + 1,
              error: result.error,
            });
            continue;
          }
        }

        await communication.update({
          status: result.status,
          error: result.error,
        });
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
