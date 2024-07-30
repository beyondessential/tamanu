import config from 'config';
import { PATIENT_COMMUNICATION_CHANNELS } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { removeFile } from '../utils/files';

// turns 'hello there' into 'h*********e'
const maskMiddle = s => s.slice(0, 1) + s.slice(1, -1).replace(/./g, '*') + s.slice(-1);

// turns 'test@gmail.com' into 't**t@g*******m'
const maskEmail = email => email.replace(/[^@]*/g, maskMiddle);

export class PatientEmailCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.patientEmailCommunicationProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'PatientEmailCommunicationProcessor';
  }

  async countQueue() {
    const { PatientCommunication } = this.context.store.models;
    return PatientCommunication.countPendingMessages(PATIENT_COMMUNICATION_CHANNELS.EMAIL);
  }

  async run() {
    const { Patient, PatientCommunication } = this.context.store.models;

    const emailsToBeSent = await PatientCommunication.getPendingMessages(
      PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      {
        include: [
          {
            model: Patient,
            as: 'patient',
          },
        ],
        limit: this.config.limit,
      },
    );

    const sendEmails = emailsToBeSent.map(async email => {
      const emailPlain = email.get({
        plain: true,
      });
      const toAddress = emailPlain.destination || emailPlain.patient?.email;

      log.info('Sending email to patient', {
        communicationId: emailPlain.id,
        type: emailPlain.type,
        patientId: emailPlain.patient?.id,
        email: toAddress ? maskEmail(toAddress) : null,
      });

      const result = await this.context.emailService.sendEmail({
        to: toAddress,
        from: config.mailgun.from,
        subject: emailPlain.subject,
        text: emailPlain.content,
        attachment: emailPlain.attachment,
      });
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

      if (emailPlain.attachment) await removeFile(emailPlain.attachment);

      return email.update({
        status: result.status,
        error: result.error,
      });
    });
    return Promise.all(sendEmails);
  }
}
