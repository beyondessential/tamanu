import config from 'config';
import { PATIENT_COMMUNICATION_CHANNELS, COMMUNICATION_STATUSES } from 'shared/constants';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import TG from 'telegram-bot-api';

export class PatientIMCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    super("0 * * * * *", log);
    this.config = config.telegram;
    this.context = context;

    this.api = new TG({
      token: this.config.apiKey,
    })

    const mp = new TG.GetUpdateMessageProvider();
    this.api.setMessageProvider(mp);
    
    // TODO: replace with actual db records
    this.patients = {};
    this.messages = [];

    this.api.on('update', ({ message }) => {
      try {
        this.onMessage(message);
      } catch(e) {
        console.error(e);
      }
    });

    log.info("Starting telegram bot");
    this.api.start();

    this.run();
  }

  cancelPolling() {
    super.cancelPolling();
    log.info('Stopping telegram bot');
    this.api.stop();
  }

  onMessage(message) {
    const { 
      text,
      chat,
    } = message;

    // telegram interaction starts with the user sending us a message that looks like
    // `/start 1234-1234-1234-1234-abcde`
    // with the parameter as their Tamanu patientId
    const match = /\/start (.*)/;
    const startMatch = text.match(match);

    if (startMatch) {
      const [, patientId] = startMatch;
      this.onLinkAccount(patientId, chat.id);
    } else {
      log.warn("Unrecognised telegram message", message);
    }
  }

  async onLinkAccount(patientId, chatId) {
    log.info('Linking patient to Telegram', { patientId, chatId });

    const patient = await this.context.store.models.Patient.findByPk(patientId);

    if (!patient) {
      this.api.sendMessage({
        chat_id: chatId,
        text: `No patient was found with ID *${patientId}* - was the link malformed somehow?`,
        parse_mode: 'Markdown',
      });
      return;
    }

    // TODO: save chat id to PAD
    this.patients[patientId] = chatId;

    // TODO: immediately queue a reminder for testing purposes
    this.messages.push({
      patientId,
      text: `Here's the reminder we promised for *${patientId}*.`,
    });

    // TODO: use a centralised name formatter
    const patientName = `${patient.firstName} ${patient.lastName}`;

    // Send a confirmation message to the patient
    log.info("Sending telegram link confirmation", { patientId });
    this.api.sendMessage({
      chat_id: chatId,
      text: `Successfully linked to Tamanu patient: *${patientName}*.`,
      parse_mode: 'Markdown',
    });
  }

  getName() {
    return 'PatientIMCommunicationProcessor';
  }

  async countQueue() {
    return this.messages.length;
  }

  async run() {
    const messages = this.messages;
    this.messages = [];

    messages.forEach(async m => {
      // TODO get chat ID from PAD
      const chatId = this.patients[m.patientId];
      this.api.sendMessage({
        chat_id: chatId,
        text: m.text,
        parse_mode: 'Markdown',
      });
    });
  }
}
