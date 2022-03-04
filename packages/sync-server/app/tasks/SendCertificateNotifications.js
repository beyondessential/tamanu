import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  ICAO_DOCUMENT_TYPES,
} from 'shared/constants';
import { makeVaccineCertificate, makeCovidTestCertificate } from '../utils/makePatientCertificate';
import { getLocalisationData } from '../utils/localisation';
import { createAndSignDocument, createProofOfVaccination, vdsConfig } from '../integrations/VdsNc';
import { log } from 'shared/services/logging';

export async function sendCertificateNotifications(certificateNotifications, models) {
  const { PatientCommunication, Patient } = models;
  const vdsEnabled = vdsConfig().enabled;

  if (certificateNotifications.length > 0) {
    log.info(
      `Starting: certificate notification sync-hook task with ${certificateNotifications.length} to process`,
    );
  } else {
    return;
  }
  for (const notification of certificateNotifications) {
      const patientId = notification.get('patientId');
      const patient = await Patient.findByPk(patientId);

      const requireSigning = notification.get('requireSigning');
      const type = notification.get('type');

      // TODO: downgrade to debug once this is stable
      log.info(
        `Processing certificate notification: id=${notification.id} patient=${patientId} type=${type} requireSigning=${requireSigning}`,
      );

      let template;
      let vdsData = null;
      let pdf = null;

      switch (type) {
        case ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON:
          template = 'vaccineCertificateEmail';

          if (requireSigning && vdsEnabled) {
            log.debug('Generating VDS data for proof of vaccination');
            const povData = await createProofOfVaccination(patient.id, { models });
            const uniqueProofId = await patient.getIcaoUVCI();
            const vdsDoc = await createAndSignDocument(type, povData, uniqueProofId);
            vdsData = await vdsDoc.intoVDS();
          }

          pdf = await makeVaccineCertificate(patient, models, vdsData);
          break;

        case ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON:
          template = 'covidTestCertificateEmail';
          if (requireSigning && vdsEnabled) {
            log.debug('Generating VDS data for proof of testing (unsupported, ignoring)');
            // TODO: const labTestId = ???
            // const potData = await createProofOfVaccination(labTestId);
            // const vdsDoc = await createAndSignDocument(type, potData);
            // vdsData = await vdsDoc.intoVDS();
          }

          pdf = await makeCovidTestCertificate(patient, models, vdsData);
          break;
        default:
          throw new Error(`Unknown certificate type ${type}`);
      }

      log.debug('Creating communication record');
      // build the email notification
      await PatientCommunication.create({
        type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
        channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
        subject: getLocalisationData(`templates.${template}.subject`),
        content: getLocalisationData(`templates.${template}.body`),
        status: COMMUNICATION_STATUSES.QUEUED,
        patientId,
        destination: notification.get('forwardAddress'),
        attachment: pdf.filePath,
      });
    }
}
