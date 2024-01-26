import { PATIENT_COMMUNICATION_CHANNELS, COMMUNICATION_STATUSES } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

import { removeFile } from '../utils/files';

// turns 'hello there' into 'h*********e'
const maskMiddle = s => s.slice(0, 1) + s.slice(1, -1).replace(/./g, '*') + s.slice(-1);

// turns 'test@gmail.com' into 't**t@g*******m'
const maskEmail = email => email.replace(/[^@]*/g, maskMiddle);

export class PatientEmailCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    const { schedules, settings, store, emailService } = context;
    const { jitterTime, schedule } = schedules.patientEmailCommunicationProcessor;
    super(schedule, log, jitterTime);
    this.models = store.models;
    this.settings = settings;
    this.emailService = emailService;
  }

  getName() {
    return 'PatientEmailCommunicationProcessor';
  }

  async countQueue() {
    const { PatientCommunication } = this.models;
    return PatientCommunication.count({
      where: {
        status: COMMUNICATION_STATUSES.QUEUED,
        channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      },
    });
  }

  async run() {
    const { Patient, PatientCommunication } = this.models;

    const limit = await this.context.settings.get(
      'schedules.patientEmailCommunicationProcessor.limit',
    );

    const emailsToBeSent = await PatientCommunication.findAll({
      where: {
        status: COMMUNICATION_STATUSES.QUEUED,
        channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      },
      include: [
        {
          model: Patient,
          as: 'patient',
        },
      ],
      order: [['createdAt', 'ASC']], // process in order received
      limit,
    });

    const sender = await this.context.settings.get('mailgun.from');

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

      try {
        const result = await this.emailService.sendEmail({
          to: toAddress,
          from: sender,
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
        return email.update({
          status: result.status,
          error: result.error,
        });
      } catch (e) {
        log.warn('Email errored', {
          communicationId: emailPlain.id,
          error: e.stack,
        });
        return email.update({
          status: COMMUNICATION_STATUSES.ERROR,
          error: e.message,
        });
      } finally {
        if (emailPlain.attachment) await removeFile(emailPlain.attachment);
      }
    });
    return Promise.all(sendEmails);
  }
}
