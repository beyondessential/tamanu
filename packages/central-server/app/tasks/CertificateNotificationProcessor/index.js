import config from 'config';

import {
  CERTIFICATE_NOTIFICATION_STATUSES,
  COMMUNICATION_STATUSES,
  COVID_19_CLEARANCE_CERTIFICATE,
  ICAO_DOCUMENT_TYPES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  VACCINATION_CERTIFICATE,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { CertificateTypes } from '@tamanu/shared/utils/patientCertificates';
import {
  makeCovidCertificate,
  makeCovidVaccineCertificate,
  makeVaccineCertificate,
} from '../../utils/makePatientCertificate';

import { LabRequestNotificationGenerator } from './LabRequestNotificationGenerator';

export class CertificateNotificationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.certificateNotificationProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
    this.subtasks = [new LabRequestNotificationGenerator(context)];
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
    const {
      CertificateNotification,
      PatientCommunication,
      Patient,
      TranslatedString,
    } = models;

    const queuedNotifications = await CertificateNotification.findAll({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
      order: [['createdAt', 'ASC']],
      limit: this.config.limit,
    });

    let processed = 0;
    for (const notification of queuedNotifications) {
      try {
        const patientId = notification.get('patientId');
        const patient = await Patient.findByPk(patientId);

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
        });

        sublog.info('Processing certificate notification');

        let template;
        let pdf = null;

        switch (type) {
          case ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON: {
            template = 'covidVaccineCertificateEmail';

            sublog.info('Generating vax certificate PDF');
            pdf = await makeCovidVaccineCertificate({
              models,
              settings,
              language,
              patient,
              printedBy,
              printedDate,
            });
            break;
          }

          case ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON: {
            template = 'covidTestCertificateEmail';

            sublog.info('Generating test certificate PDF');
            pdf = await makeCovidCertificate({
              models,
              settings,
              certType: CertificateTypes.test,
              language,
              patient,
              printedBy,
            });
            break;
          }

          case COVID_19_CLEARANCE_CERTIFICATE:
            template = 'covidClearanceCertificateEmail';

            sublog.info('Generating clearance certificate PDF');
            pdf = await makeCovidCertificate({
              models,
              settings,
              certType: CertificateTypes.clearance,
              language,
              patient,
              printedBy,
            });
            break;

          case VACCINATION_CERTIFICATE:
            template = 'vaccineCertificateEmail';
            pdf = await makeVaccineCertificate({
              models,
              settings,
              facilityName,
              language,
              patient,
              printedBy,
              printedDate,
              translations,
            });
            break;

          default:
            throw new Error(`Unknown certificate type ${type}`);
        }

        sublog.debug('Creating communication record');

        const { subject, body: content } = await settings.get(`templates.${template}`);

        // eslint-disable-next-line no-loop-func
        const [comm] = await sequelize.transaction(() =>
          Promise.all([
            PatientCommunication.create({
              type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
              channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
              subject,
              content,
              status: COMMUNICATION_STATUSES.QUEUED,
              patientId,
              destination: notification.get('forwardAddress'),
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
