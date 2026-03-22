import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { removeFile } from '../utils/files';

const maskMiddle = s => s.slice(0, 1) + s.slice(1, -1).replace(/./g, '*') + s.slice(-1);
const maskEmail = email => email.replace(/[^@]*/g, maskMiddle);

export class BaseCommunicationProcessor extends ScheduledTask {
  constructor(context, configKey, channel) {
    const conf = config.schedules[configKey];
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);

    this.config = conf;
    this.context = context;
    this.channel = channel;
  }

  getName() {
    return this.constructor.name;
  }

  async countQueue() {
    const { PatientCommunication } = this.context.store.models;
    return PatientCommunication.countPendingMessages(this.channel);
  }

  async transformContent(emailRecord) {
    return emailRecord.content;
  }

  async run() {
    return this.processEmails();
  }

  async processEmails() {
    const { Patient, PatientCommunication } = this.context.store.models;

    const emailsToBeSent = await PatientCommunication.getPendingMessages(this.channel, {
      include: [{ model: Patient, as: 'patient' }],
      limit: this.config.limit,
    });

    const sendEmails = emailsToBeSent.map(email => this.processEmail(email));
    return Promise.all(sendEmails);
  }

  async processEmail(email) {
    const emailPlain = email.get({ plain: true });
    const toAddress = emailPlain.destination || emailPlain.patient?.email;

    log.info('Sending email to patient', {
      communicationId: emailPlain.id,
      type: emailPlain.type,
      patientId: emailPlain.patient?.id,
      email: toAddress ? maskEmail(toAddress) : null,
    });

    const transformedContent = await this.transformContent(emailPlain);

    const result = await this.context.emailService.sendEmail({
      to: toAddress,
      from: config.mailgun.from,
      subject: emailPlain.subject,
      text: transformedContent,
      attachment: emailPlain.attachment,
    });

    return this.handleEmailResult(email, emailPlain, result);
  }

  async handleEmailResult(email, emailPlain, result) {
    if (result.error) {
      log.warn('Email failed', {
        communicationId: emailPlain.id,
        error: result.error,
      });
    }

    if (result.shouldRetry) {
      return email.update({
        retryCount: emailPlain.retryCount + 1,
        error: result.error,
      });
    }

    if (emailPlain.attachment) {
      await removeFile(emailPlain.attachment);
    }

    return email.update({
      status: result.status,
      error: result.error,
    });
  }
}
