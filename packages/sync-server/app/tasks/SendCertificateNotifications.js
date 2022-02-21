import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from 'shared/constants';
import { makeVaccineCertificate } from '../utils/makePatientCertificate';

export async function sendCertificateNotifications(certificateNotifications, models) {
  const { PatientCommunication, Patient } = models;

  for (const notification of certificateNotifications) {
    const patientId = notification.get('patientId');
    const patient = await Patient.findByPk(patientId);

    if (notification.get('requireSigning')) {
      // TODO: Sign certificate
    }

    const vdsData = [{ msg: 'test', sng: 'test' }];
    const { filePath } = await makeVaccineCertificate(patient, models, vdsData);

    // build the email notification
    // TODO: Confirm the actual copy for this email
    const notificationSubject = 'Medical Certificate now available';
    const notificationContent = `A medical certificate has been generated for you
    Your certificate is available attached to this email`;

    await PatientCommunication.create({
      type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
      channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      subject: notificationSubject,
      content: notificationContent,
      status: COMMUNICATION_STATUSES.QUEUED,
      patientId,
      destination: notification.get('forwardAddress'),
      attachment: filePath,
    });
  }
}
