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
    
    this.patients = {};
    this.messages = [];

    this.api.on('update', ({ message }) => {
      try {

      const { 
        text,
        chat,
      } = message;
      const match = /\/start (.*)/;
      const startMatch = text.match(match);
      console.log("Received message", text, startMatch);
      if (!startMatch) return;
      
      const patientId = startMatch[1];
      const chatId = chat.id;

      console.log("Queueing message for", patientId);
      this.patients[patientId] = chatId;
      this.messages.push({
        patientId,
        text: `Here is the reminder we promised for *${patientId}*.`,
      })

      console.log("Sending link response for", patientId);
      this.api.sendMessage({
        chat_id: chatId,
        text: `Successfully linked to Tamanu patient *${patientId}*. 
        
We will send you a vaccine reminder in a few minutes.`,
        parse_mode: 'Markdown',
      })
    } catch(e) {
      console.error(e);
    }
    });

    this.api.start();
    this.run();
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
