import { PATIENT_COMMUNICATION_CHANNELS } from '@tamanu/constants';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { BaseCommunicationProcessor } from './BaseCommunicationProcessor';
import { PortalOneTimeTokenService } from '../patientPortal/auth/PortalOneTimeTokenService';

export class PortalCommunicationProcessor extends BaseCommunicationProcessor {
  constructor(context) {
    super(context, 'portalCommunicationProcessor', PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL);
  }

  async transformContent(emailRecord) {
    const portalOneTimeTokenService = new PortalOneTimeTokenService(this.context.store.models);
    const { token } = await portalOneTimeTokenService.createRegisterToken(emailRecord.patientId);
    const registrationLink = `http://localhost:5173/register/${token}`;

    return replaceInTemplate(emailRecord.content, {
      registrationLink,
    });
  }
}
