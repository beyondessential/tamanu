import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  ICAO_DOCUMENT_TYPES,
} from 'shared/constants';
import { makeVaccineCertificate } from '../utils/makePatientCertificate';
import { getLocalisationData } from '../utils/localisation';
import { createAndSignDocument, createProofOfVaccination, vdsConfig } from '../integrations/VdsNc';

export async function sendCertificateNotifications(certificateNotifications, models) {
  const { PatientCommunication, Patient } = models;
  const vdsEnabled = vdsConfig().enabled;

  for (const notification of certificateNotifications) {
    const patientId = notification.get('patientId');
    const patient = await Patient.findByPk(patientId);

    const requireSigning = notification.get('requireSigning');
    const type = notification.get('type');

    let template;
    let vdsData = null;
    switch (type) {
      case ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON:
        template = 'vaccineCertificateEmail';

        if (requireSigning && vdsEnabled) {
          // Could this just be functional and we delete the VdsNcDocument model and table?
          const povData = await createProofOfVaccination(patient.id);
          const uniqueProofId = patient.getIcauUVCI();
          const vdsDoc = await createAndSignDocument(type, povData, uniqueProofId);
          vdsData = await vdsDoc.intoVDS();
        }
        break;

      case ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON:
        template = 'covidTestCertificateEmail';
        if (requireSigning && vdsEnabled) {
          // TODO: const labTestId = ???
          // const potData = await createProofOfVaccination(labTestId);
          // const vdsDoc = await createAndSignDocument(type, potData);
          // vdsData = await vdsDoc.intoVDS();
        }
        break;
      default:
        throw new Error(`Unknown certificate type ${type}`);
    }

    const { filePath } = await makeVaccineCertificate(patient, models, vdsData);

    // build the email notification
    await PatientCommunication.create({
      type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
      channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      subject: getLocalisationData(`templates.${template}.subject`),
      content: getLocalisationData(`templates.${template}.body`),
      status: COMMUNICATION_STATUSES.QUEUED,
      patientId,
      destination: notification.get('forwardAddress'),
      attachment: filePath,
    });
  }
}
