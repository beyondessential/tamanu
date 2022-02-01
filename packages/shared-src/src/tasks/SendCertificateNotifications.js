import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '../constants';

export async function sendCertificateNotifications(certificateNotifications, models) {
  const { PatientCommunication } = models;

  for (const notification of certificateNotifications) {
    // TODO: Generate the actual certificate
    if (notification.get('requireSigning')) {
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
      patientId: notification.get('patientId'),
      destination: notification.get('forwardAddress'),
      // attachment: file
    });
  }
}
