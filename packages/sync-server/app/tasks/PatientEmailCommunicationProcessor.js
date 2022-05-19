import config from 'config';
import { PATIENT_COMMUNICATION_CHANNELS, COMMUNICATION_STATUSES } from 'shared/constants';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

export class PatientEmailCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.patientEmailCommunicationProcessor;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'PatientEmailCommunicationProcessor';
  }

  async countQueue() {
    const { PatientCommunication } = this.context.store.models;
    return PatientCommunication.count({
      where: {
        status: COMMUNICATION_STATUSES.QUEUED,
        channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      },
    });
  }

  async run() {
    const { Patient, PatientCommunication } = this.context.store.models;

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
      limit: this.config.limit,
    });

    const sendEmails = emailsToBeSent.map(async email => {
      const emailPlain = email.get({
        plain: true,
      });
      const toAddress = emailPlain.destination || emailPlain.patient?.email;
      log.info('\n');
      log.info(`Processing email : ${emailPlain.id}`);
      log.info(`Email type       : ${emailPlain.type}`);
      log.info(`Email to patient : ${emailPlain.patient?.id}`);
      log.info(`At address       : ${toAddress}`);
      try {
        const result = await this.context.emailService.sendEmail({
          to: toAddress,
          from: config.mailgun.from,
          subject: emailPlain.subject,
          text: emailPlain.content,
          attachment: emailPlain.attachment,
        });
        return email.update({
          status: result.status,
          error: result.error,
        });
      } catch (e) {
        return email.update({
          status: COMMUNICATION_STATUSES.ERROR,
          error: e.message,
        });
      }
    });
    return Promise.all(sendEmails);
  }
}
