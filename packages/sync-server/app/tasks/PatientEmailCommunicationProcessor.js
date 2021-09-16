import config from 'config';
import { PATIENT_COMMUNICATION_CHANNELS, COMMUNICATION_STATUSES } from 'shared/constants';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

export class PatientEmailCommunicationProcessor extends ScheduledTask {
  constructor(context) {
    super('*/30 * * * * *', log);
    this.context = context;
  }

  getName() { 
    return 'PatientEmailCommunicationProcessor';
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
      limit: 10,
    });
    const sendEmails = emailsToBeSent.map(async email => {
      const emailPlain = email.get({
        plain: true,
      });
      log.info('\n');
      log.info(`Processing email : ${emailPlain.id}`);
      log.info(`Email type       : ${emailPlain.type}`);
      log.info(`Email to patient : ${emailPlain.patient?.id}`);
      try {
        const result = await this.context.emailService.sendEmail({
          to: emailPlain.patient?.email,
          from: config.mailgun.from,
          subject: emailPlain.subject,
          content: emailPlain.content,
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
