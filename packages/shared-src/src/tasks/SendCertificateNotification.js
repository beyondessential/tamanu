import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '../constants';

export async function sendCertificateNotification(certificateNotification, models) {
  const { PatientCommunication } = models;

  // TODO: Generate the actual certificate
  if (certificateNotification.get('requireSigning')) {
    // TODO: Sign certificate
  }

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
    patientId: certificateNotification.get('patientId'),
    destination: certificateNotification.get('forwardAddress'),
    // attachment: file
  });
}
