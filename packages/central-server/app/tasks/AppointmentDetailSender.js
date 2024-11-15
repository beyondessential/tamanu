import config from 'config';

import {
  CERTIFICATE_NOTIFICATION_STATUSES,
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { makeVaccineCertificate } from '../../utils/makePatientCertificate';

// TODO: bad name
export class AppointmentDetailSender extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.AppointmentDetailSender;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'CertificateNotificationProcessor';
  }

  async countQueue() {
    return this.context.store.models.CertificateNotification.count({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
    });
  }

  async run() {
    const { settings, store } = this.context;
    const { models, sequelize } = store;
    const { Appointment, PatientCommunication, Patient, TranslatedString } = models;

    // TODO: fetch all unsent appointment emails (new column possibly? :thinking")
    const appointmentsToEmail = Appointment.findAll({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: this.config.limit,
    });

    let processed = 0;
    for (const appointment of appointmentsToEmail) {
      try {
        const patientId = notification.get('patientId');
        const patient = await Patient.findByPk(patientId);

        const requireSigning = notification.get('requireSigning');
        const type = notification.get('type');
        const printedBy = notification.get('createdBy');
        const printedDate = notification.get('printedDate');
        const facilityName = notification.get('facilityName');
        const language = notification.get('language');

        const translations = await TranslatedString.getTranslations(language, ['pdf']);

        const sublog = log.child({
          id: notification.id,
          patient: patientId,
          type,
          requireSigning,
        });

        sublog.info('Processing certificate notification');

        const template = 'vaccineCertificateEmail';
        const pdf = await makeVaccineCertificate({
          models,
          settings,
          facilityName,
          language,
          patient,
          printedBy,
          printedDate,
          translations,
        });

        sublog.debug('Creating communication record');

        // TODO: possibly configurable. move to setting if so
        // const { subject, body: content } = await settings.get(`templates.${template}`);

        const subject = 'Appointment confirmation';
        const content = `
            Hi ${appointment.patient.firstName} ${appointment.patient.lastName},

            This is a confirmation that your appointment has been scheduled at <facility>.
            Date: ${appointment.patient.startTime} // to date
            Time: ${appointment.patient.startTime} // to time
            Location: ${appointment.locationGroup.name}, ${appointment.locationGroup.facility.name} 
            Clinician: Clinician name (if recorded, otherwise don't display this field)

            Do not respond to this email. 
        `;

        // eslint-disable-next-line no-loop-func
        const [comm] = await sequelize.transaction(() =>
          // queue the email to be sent and mark this notification as processed
          Promise.all([
            PatientCommunication.create({
              type: PATIENT_COMMUNICATION_TYPES.APPOINTMENT_CONFIRMATION,
              channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
              subject,
              content,
              status: COMMUNICATION_STATUSES.QUEUED,
              patientId,
              destination: notification.get('forwardAddress'), // TODO: how to get email here
              attachment: pdf.filePath,
            }),
            notification.update({
              status: CERTIFICATE_NOTIFICATION_STATUSES.PROCESSED,
            }),
          ]),
        );
        processed += 1;
        sublog.info('Done processing certificate notification', { emailId: comm.id });
      } catch (error) {
        log.error('Failed to process certificate notification', { id: notification.id, error });
        await notification.update({
          status: CERTIFICATE_NOTIFICATION_STATUSES.ERROR,
          error: error.message,
        });
      }
    }

    log.info('Done with certificate notification task', {
      attempted: queuedNotifications.length,
      processed,
    });
  }
}
