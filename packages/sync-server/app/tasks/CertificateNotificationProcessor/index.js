import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  ICAO_DOCUMENT_TYPES,
  CERTIFICATE_NOTIFICATION_STATUSES,
  COVID_19_CLEARANCE_CERTIFICATE,
  VACCINATION_CERTIFICATE,
} from '@tamanu/constants';
import { log } from 'shared/services/logging';
import { ScheduledTask } from 'shared/tasks';
import { generateUVCI } from 'shared/utils/uvci';
import { CertificateTypes } from 'shared/utils/patientCertificates';
import {
  makeVaccineCertificate,
  makeCovidVaccineCertificate,
  makeCovidCertificate,
} from '../../utils/makePatientCertificate';
import { createVdsNcVaccinationData, VdsNcDocument } from '../../integrations/VdsNc';
import { createEuDccVaccinationData, HCERTPack } from '../../integrations/EuDcc';

import { LabRequestNotificationGenerator } from './LabRequestNotificationGenerator';

export class CertificateNotificationProcessor extends ScheduledTask {
  constructor(context) {
    const { schedules, settings, store } = context;
    super(schedules.certificateNotificationProcessor.schedule, log);
    this.settings = settings;
    this.models = store.models;
    this.subtasks = [new LabRequestNotificationGenerator(context)];
  }

  getName() {
    return 'CertificateNotificationProcessor';
  }

  async countQueue() {
    return this.models.CertificateNotification.count({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
    });
  }

  async run() {
    const {
      AdministeredVaccine,
      CertificateNotification,
      CertifiableVaccine,
      PatientCommunication,
      Patient,
    } = this.models;

    const limit = await this.settings.get('schedules.certificateNotificationProcessor.limit');
    const integrations = await this.settings.get('integrations');
    const vdsEnabled = integrations.vdsNc.enabled;
    const euDccEnabled = integrations.euDcc.enabled;

    const certifiableVaccineIds = await CertifiableVaccine.allVaccineIds(euDccEnabled);

    const queuedNotifications = await CertificateNotification.findAll({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit,
    });

    let processed = 0;
    for (const notification of queuedNotifications) {
      try {
        const patientId = notification.get('patientId');
        const patient = await Patient.findByPk(patientId);

        const requireSigning = notification.get('requireSigning');
        const type = notification.get('type');
        const printedBy = notification.get('createdBy');
        const printedDate = notification.get('printedDate');

        const countryCode = await this.settings.get('country.alpha-2');

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
            const latestCertifiableVax = await AdministeredVaccine.lastVaccinationForPatient(
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
                  models: this.models,
                  settings: this.settings,
                });

                qrData = await HCERTPack(povData, { models: this.models, settings: this.settings });
              } else if (vdsEnabled) {
                sublog.debug('Generating VDS data for proof of vaccination', {
                  vax: latestCertifiableVax.id,
                });

                uvci = await generateUVCI(latestCertifiableVax.id, { format: 'icao', countryCode });

                const povData = await createVdsNcVaccinationData(patient.id, {
                  models: this.models,
                  settings: this.settings,
                });
                const vdsDoc = new VdsNcDocument(type, povData, uvci);
                vdsDoc.models = this.models;
                await vdsDoc.sign();

                qrData = await vdsDoc.intoVDS();
              } else if (requireSigning) {
                sublog.warn('Signing is required but certificate contains no certifiable vaccines');
              } else {
                sublog.error('Signing is required but neither EU DCC nor VDS is enabled');
              }
            }

            sublog.info('Generating vax certificate PDF', { uvci });
            pdf = await makeCovidVaccineCertificate(
              { models: this.models, settings: this.settings },
              patient,
              printedBy,
              printedDate,
              uvci,
              qrData,
            );
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
            pdf = await makeCovidCertificate(
              { models: this.models, settings: this.settings },
              CertificateTypes.test,
              patient,
              printedBy,
              qrData,
            );
            break;
          }

          case COVID_19_CLEARANCE_CERTIFICATE:
            template = 'covidClearanceCertificateEmail';

            sublog.info('Generating clearance certificate PDF');
            pdf = await makeCovidCertificate(
              { models: this.models, settings: this.settings },
              CertificateTypes.clearance,
              patient,
              printedBy,
              qrData,
            );
            break;

          case VACCINATION_CERTIFICATE:
            template = 'vaccineCertificateEmail';
            pdf = await makeVaccineCertificate(
              { models: this.models, settings: this.settings },
              patient,
              printedBy,
              printedDate,
            );
            break;

          default:
            throw new Error(`Unknown certificate type ${type}`);
        }
        const { subject, body } = await this.settings.get(`localisation.templates.${template}`);

        sublog.debug('Creating communication record');
        // build the email notification
        const comm = await PatientCommunication.create({
          type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          subject,
          content: body,
          status: COMMUNICATION_STATUSES.QUEUED,
          patientId,
          destination: notification.get('forwardAddress'),
          attachment: pdf.filePath,
        });
        sublog.info('Done processing certificate notification', { emailId: comm.id });

        processed += 1;
        await notification.update({
          status: CERTIFICATE_NOTIFICATION_STATUSES.PROCESSED,
        });
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
