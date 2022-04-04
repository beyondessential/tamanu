import config from 'config';
import { get } from 'lodash';

import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  ICAO_DOCUMENT_TYPES,
  CERTIFICATE_NOTIFICATION_STATUSES,
} from 'shared/constants';
import { log } from 'shared/services/logging';
import { ScheduledTask } from 'shared/tasks';
import { makeVaccineCertificate, makeCovidTestCertificate } from '../utils/makePatientCertificate';
import { getLocalisation } from '../localisation';
import { createProofOfVaccination, VdsNcDocument } from '../integrations/VdsNc';
import { createCovidVaccinationCertificateData, HCERTPack } from '../integrations/EuDcc';

export class CertificateNotificationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.certificateNotificationProcessor;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'CertificateNotificationProcessor';
  }

  async run() {
    const { models } = this.context.store;
    const { CertificateNotification, PatientCommunication, Patient } = models;
    const vdsEnabled = config.integrations.vdsNc.enabled;
    const localisation = await getLocalisation();

    const queuedNotifications = await CertificateNotification.findAll({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: this.config.limit,
    });
    if (queuedNotifications.length > 0) {
      log.info(
        `Starting: certificate notification sync-hook task with ${queuedNotifications.length} to process`,
      );
    } else {
      return;
    }

    let processed = 0;
    for (const notification of queuedNotifications) {
      try {
        const patientId = notification.get('patientId');
        const patient = await Patient.findByPk(patientId);

        const requireSigning = notification.get('requireSigning');
        const type = notification.get('type');
        const printedBy = notification.get('createdBy');

        log.info(
          `Processing certificate notification: id=${notification.id} patient=${patientId} type=${type} requireSigning=${requireSigning}`,
        );

        let template;
        let qrData = null;
        let pdf = null;

        switch (type) {
          case ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON: {
            template = 'vaccineCertificateEmail';
            const latestVax = await models.AdministeredVaccine.lastVaccinationForPatient(
              patient.id,
            );
            const latestCovidVax = await models.AdministeredVaccine.lastVaccinationForPatient(
              patient.id,
              ['COVID-19 AZ', 'COVID-19 Pfizer'],
            );

            let uvci;
            if (requireSigning) {
              if (euDccEnabled) {
                log.debug('Generating EU DCC data for proof of vaccination');
                if (latestCovidVax) {
                  uvci = await generateUVCI(latestCovidVax.id, 'eudcc');

                  const povData = await createCovidVaccinationCertificateData(latestCovidVax.id, {
                    models,
                  });
                  
                  qrData = await HCERTPack(povData, { models });
                } else {
                  log.warn(
                    'EU DCC signing requested but certificate contains no Covid vaccination data',
                  );
                }
              } else if (vdsEnabled) {
                log.debug('Generating VDS data for proof of vaccination');
                uvci = await generateUVCI(latestCovidVax.id, 'icao');

                const povData = await createProofOfVaccination(patient.id, { models });
                const vdsDoc = new VdsNcDocument(type, povData, uvci);
                vdsDoc.models = models;
                await vdsDoc.sign();

                qrData = await vdsDoc.intoVDS();
              } else {
                log.error('Signing is required but neither EU DCC nor VDS is enabled');
              }
            }

            // As fallback, generate ICAO flavour from last (not necessarily covid) vaccine
            if (!uvci) uvci = await generateUVCI(latestVax.id, 'icao');

            pdf = await makeVaccineCertificate(patient, printedBy, models, uvci, qrData);
            break;
          }

          case ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON: {
            template = 'covidTestCertificateEmail';
            if (false && requireSigning && vdsEnabled) {
              // log.debug('Generating VDS data for proof of testing');
              // const potData = await createProofOfTesting(labTestId ???, { models });
              // const uniqueProofId = await patient.getIcaoUTCI()???;
              // const vdsDoc = new Document(type, potData, uniqueProofId);
              // vdsDoc.models = models;
              // await vdsDoc.sign();
              // vdsData = await vdsDoc.intoVDS();
            }

            log.debug('Making test PDF');
            pdf = await makeCovidTestCertificate(patient, printedBy, models, qrData);
            break;
          }

          default:
            throw new Error(`Unknown certificate type ${type}`);
        }

        log.debug('Creating communication record');
        // build the email notification
        await PatientCommunication.create({
          type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          subject: get(localisation, `templates.${template}.subject`),
          content: get(localisation, `templates.${template}.body`),
          status: COMMUNICATION_STATUSES.QUEUED,
          patientId,
          destination: notification.get('forwardAddress'),
          attachment: pdf.filePath,
        });

        processed += 1;
        await notification.update({
          status: CERTIFICATE_NOTIFICATION_STATUSES.PROCESSED,
        });
      } catch (error) {
        log.error(`Failed to process certificate notification id=${notification.id}: ${error}`);
        await notification.update({
          status: CERTIFICATE_NOTIFICATION_STATUSES.ERROR,
          error: error.message,
        });
      }
    }

    log.info(
      `Done: certificate notification sync-hook task. attempted=${queuedNotifications.length} processed=${processed}`,
    );
  }
}
