import TG from 'telegram-bot-api';

import config from 'config';

import { log } from 'shared/services/logging';
import {
  PATIENT_COMMUNICATION_CHANNELS, 
  PATIENT_COMMUNICATION_TYPES 
} from 'shared/constants/comms';
import { COMMUNICATION_STATUSES } from 'shared/constants/statuses';

export class TelegramService {

  constructor(context) {
    this.context = context;
    this.api = new TG({
      token: config.telegram.apiKey,
    })

    const mp = new TG.GetUpdateMessageProvider();
    this.api.setMessageProvider(mp);
    
    this.api.on('update', ({ message }) => {
      try {
        this.onMessage(message);
      } catch(e) {
        console.error(e);
      }
    });
  }

  start() {
    log.info("Starting telegram bot");
    this.api.start();
  }
  
  stop() {
    log.info('Stopping telegram bot');
    try {
      this.api.stop();
    } catch(e) {
      log.error("Error stopping telegram bot", e);
    }
  }

  onMessage(message) {
    const { 
      text,
      chat,
    } = message;

    // telegram interaction starts with the user's client sending us
    // a message that looks like `/start 1234-1234-1234-1234-abcde`
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
    const { models } = this.context.store;

    const patient = await models.Patient.findByPk(patientId);

    if (!patient) {
      this.api.sendMessage({
        chat_id: chatId,
        text: `No patient was found with ID *${patientId}* - was the link malformed somehow?`,
        parse_mode: 'Markdown',
      });
      return;
    }

    await models.PatientAdditionalData.updateForPatient(patientId, {
      telegramChatId: chatId,
    });

    // TEMPORARY: immediately queue a reminder for testing purposes
    // TODO: add a real vaccine reminder system to queue these properly
    await models.PatientCommunication.create({
      channel: PATIENT_COMMUNICATION_CHANNELS.WHATSAPP, // TODO: de-enumify and use 'telegram'
      status: COMMUNICATION_STATUSES.QUEUED,
      type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,  // TODO: de-enumify and use 'vaccineReminder'
      content: `Here's the reminder we promised for *{patientName}*`,
      patientId,
    })

    const patientName = patient.getFormattedName();

    // Send a confirmation message to the patient
    log.info("Sending telegram link confirmation", { patientId });
    this.api.sendMessage({
      chat_id: chatId,
      text: `Successfully linked to Tamanu patient: *${patientName}*.`,
      parse_mode: 'Markdown',
    });
  }

  async sendPatientCommunication(patientCommunication) {
    const { models } = this.context.store;
    const { patientId, content } = patientCommunication;
    const patient = await models.Patient.findByPk(patientId);
    const pad = await models.PatientAdditionalData.getOrCreateForPatient(patientId);

    const chatId = pad.telegramChatId;
    if (!chatId) {
      log.error('Patient does not have a telegram chat ID', { patientId });
      throw new Error('Patient does not have a telegram chat ID');
    }

    // TODO: Smarter text replacement system
    const text = content.replace("{patientName}", patient.getFormattedName());

    this.api.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    });
  }
}
