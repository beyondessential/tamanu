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
import { generateUVCI } from '@tamanu/shared/utils/uvci';
import { CertificateTypes } from '@tamanu/shared/utils/patientCertificates';
import {
  makeCovidCertificate,
  makeCovidVaccineCertificate,
  makeVaccineCertificate,
} from '../../utils/makePatientCertificate';
import { getLocalisation } from '../../localisation';
import { createVdsNcVaccinationData, VdsNcDocument } from '../../integrations/VdsNc';
import { createEuDccVaccinationData, HCERTPack } from '../../integrations/EuDcc';

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
      CertifiableVaccine,
      PatientCommunication,
      Patient,
      TranslatedString,
    } = models;
    const vdsEnabled = config.integrations.vdsNc.enabled;
    const euDccEnabled = config.integrations.euDcc.enabled;

    const [certifiableVaccineIds, queuedNotifications] = await Promise.all([
      CertifiableVaccine.allVaccineIds(euDccEnabled),
      CertificateNotification.findAll({
        where: {
          status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
        },
        order: [['createdAt', 'ASC']], // process in order received
        limit: this.config.limit,
      }),
    ]);

    let processed = 0;
    for (const notification of queuedNotifications) {
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

        const { country } = await getLocalisation();
        const countryCode = country['alpha-2'];

        const sublog = log.child({
          id: notification.id,
          patient: patientId,
          type,
          requireSigning,
        });

        sublog.info('Processing certificate notification');

        let template;
        let qrData = null;
        let pdf = null;

        switch (type) {
          case ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON: {
            template = 'covidVaccineCertificateEmail';
            const latestCertifiableVax = await models.AdministeredVaccine.lastVaccinationForPatient(
              patient.id,
              certifiableVaccineIds,
            );

            let uvci;
            if (requireSigning && latestCertifiableVax) {
              if (euDccEnabled) {
                sublog.debug('Generating EU DCC data for proof of vaccination', {
                  vax: latestCertifiableVax.id,
                });

                uvci = await generateUVCI(latestCertifiableVax.id, {
                  format: 'eudcc',
                  countryCode,
                });

                const povData = await createEuDccVaccinationData(latestCertifiableVax.id, {
                  models,
                });

                qrData = await HCERTPack(povData, { models });
              } else if (vdsEnabled) {
                sublog.debug('Generating VDS data for proof of vaccination', {
                  vax: latestCertifiableVax.id,
                });

                uvci = await generateUVCI(latestCertifiableVax.id, { format: 'icao', countryCode });

                const povData = await createVdsNcVaccinationData(patient.id, { models });
                const vdsDoc = new VdsNcDocument(type, povData, uvci);
                vdsDoc.models = models;
                await vdsDoc.sign();

                qrData = await vdsDoc.intoVDS();
              } else if (requireSigning) {
                sublog.warn('Signing is required but certificate contains no certifiable vaccines');
              } else {
                sublog.error('Signing is required but neither EU DCC nor VDS is enabled');
              }
            }

            sublog.info('Generating vax certificate PDF', { uvci });
            pdf = await makeCovidVaccineCertificate({
              models,
              settings,
              language,
              patient,
              printedBy,
              printedDate,
              qrData,
              uvci,
            });
            break;
          }

          case ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON: {
            // let uvci;

            template = 'covidTestCertificateEmail';
            if (requireSigning && vdsEnabled) {
              // sublog.debug('Generating VDS data for proof of testing');
              // uvci = await generateUVCI(latestCovidVax.id, { format: 'icao', countryCode });
              // const povData = await createVdsNcTestData(patient.id, { models });
              // const vdsDoc = new VdsNcDocument(type, povData, uvci);
              // vdsDoc.models = models;
              // await vdsDoc.sign();
              // qrData = await vdsDoc.intoVDS();
            }

            sublog.info('Generating test certificate PDF');
            pdf = await makeCovidCertificate({
              models,
              settings,
              certType: CertificateTypes.test,
              language,
              patient,
              printedBy,
              vdsData: qrData,
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
              vdsData: qrData,
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
          // queue the email to be sent and mark this notification as processed
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
