import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import {
  PATIENT_COMMUNICATION_CHANNELS, 
} from 'shared/constants/comms';
import { COMMUNICATION_STATUSES } from 'shared/constants/statuses';

import { TelegramService } from '../services/TelegramService';

export class PatientIMCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    super("0 * * * * *", log);
    this.context = context;

    this.telegramService = new TelegramService(context);

    this.telegramService.start();
  }

  cancelPolling() {
    super.cancelPolling();
    this.telegramService.stop();
  }

  getName() {
    return 'PatientIMCommunicationProcessor';
  }

  async countQueue() {
    return this.context.store.models.PatientCommunication.count({
      where: {
        channel: PATIENT_COMMUNICATION_CHANNELS.WHATSAPP,
        status: COMMUNICATION_STATUSES.QUEUED,
      }
    });
  }

  async run() {
    const messages = await this.context.store.models.PatientCommunication.findAll({
      where: {
        channel: PATIENT_COMMUNICATION_CHANNELS.WHATSAPP,
        status: COMMUNICATION_STATUSES.QUEUED,
      }
    });

    const sendTasks = messages.map(async m => {
      try {
        await this.telegramService.sendPatientCommunication(m);
        await m.update({ status: COMMUNICATION_STATUSES.SENT });
      } catch(e) {
        await m.update({
          status: COMMUNICATION_STATUSES.ERROR,
          error: e.message,
        });
      }
    });

    return Promise.all(sendTasks);
  }
}
