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

    this.api.start();

    this.run();
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

  onLinkAccount(patientId, chatId) {
    log.info('Linking patient to Telegram', { patientId, chatId });

    this.patients[patientId] = chatId;

    this.messages.push({
      patientId,
      text: `Here's the reminder we promised for *${patientId}*.`,
    });

    log.info("Sending link response for", { patientId });
    this.api.sendMessage({
      chat_id: chatId,
      text: `Successfully linked to Tamanu patient *${patientId}*.`,
      parse_mode: 'Markdown',
    })
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

    messages.forEach(m => {
      const chatId = this.patients[m.patientId];
      this.api.sendMessage({
        chat_id: chatId,
        text: m.text,
        parse_mode: 'Markdown',
      });
    });
  }
}
