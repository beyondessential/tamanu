import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '../constants';

export async function createReferralNotification(referral, models) {
  const { PatientCommunication, User, Department, Facility } = models;

  // retrieve data related to referral
  const referredBy = await User.findOne({ where: { id: referral.get('referredById') } });
  const referredToDepartment = await Department.findOne({
    where: { id: referral.get('referredToDepartmentId') },
  });
  const referredToFacility = await Facility.findOne({
    where: { id: referral.get('referredToFacilityId') },
  });

  // build the email notification
  const notificationSubject = 'Medical referral made for you';
  const notificationContent = `You have been referred to another health facility for further examination or treatment.
Referred by: ${referredBy.displayName}
Referred to: ${referredToDepartment.name} at ${referredToFacility.name}
Please attend this health facility as soon as possible.
  `;

  await PatientCommunication.create({
    type: PATIENT_COMMUNICATION_TYPES.REFERRAL_CREATED,
    channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
    subject: notificationSubject,
    content: notificationContent,
    status: COMMUNICATION_STATUSES.QUEUED,
    patientId: referral.get('patientId'),
  });
}
