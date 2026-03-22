import { PATIENT_COMMUNICATION_CHANNELS } from '@tamanu/constants';
import { BaseCommunicationProcessor } from './BaseCommunicationProcessor';

export class PatientEmailCommunicationProcessor extends BaseCommunicationProcessor {
  constructor(context) {
    super(context, 'patientEmailCommunicationProcessor', PATIENT_COMMUNICATION_CHANNELS.EMAIL);
  }
}
