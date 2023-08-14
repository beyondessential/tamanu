import config from 'config';
import { get } from 'lodash';

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
import { getLocalisation } from '../../localisation';
import { createVdsNcVaccinationData, VdsNcDocument } from '../../integrations/VdsNc';
import { createEuDccVaccinationData, HCERTPack } from '../../integrations/EuDcc';

import { LabRequestNotificationGenerator } from './LabRequestNotificationGenerator';

export class CertificateNotificationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.certificateNotificationProcessor;
    super(conf.schedule, log);
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
    const { models } = this.context.store;
    const { CertificateNotification, CertifiableVaccine, PatientCommunication, Patient } = models;
    const vdsEnabled = config.integrations.vdsNc.enabled;
    const euDccEnabled = config.integrations.euDcc.enabled;
    const localisation = await getLocalisation();

    const certifiableVaccineIds = await CertifiableVaccine.allVaccineIds(euDccEnabled);

    const queuedNotifications = await CertificateNotification.findAll({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: this.config.limit,
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
            pdf = await makeCovidVaccineCertificate(
              patient,
              printedBy,
              printedDate,
              models,
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
              CertificateTypes.test,
              patient,
              printedBy,
              models,
              qrData,
            );
            break;
          }

          case COVID_19_CLEARANCE_CERTIFICATE:
            template = 'covidClearanceCertificateEmail';

            sublog.info('Generating clearance certificate PDF');
            pdf = await makeCovidCertificate(
              CertificateTypes.clearance,
              patient,
              printedBy,
              models,
              qrData,
            );
            break;

          case VACCINATION_CERTIFICATE:
            template = 'vaccineCertificateEmail';
            pdf = await makeVaccineCertificate(patient, printedBy, printedDate, models);
            break;

          default:
            throw new Error(`Unknown certificate type ${type}`);
        }

        sublog.debug('Creating communication record');
        // build the email notification
        const comm = await PatientCommunication.create({
          type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          subject: get(localisation, `templates.${template}.subject`),
          content: get(localisation, `templates.${template}.body`),
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
