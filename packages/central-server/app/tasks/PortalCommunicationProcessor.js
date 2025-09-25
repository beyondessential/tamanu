import config from 'config';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { NotFoundError } from '@tamanu/errors';
import { PATIENT_COMMUNICATION_CHANNELS, PATIENT_COMMUNICATION_TYPES } from '@tamanu/constants';
import { BaseCommunicationProcessor } from './BaseCommunicationProcessor';
import { PortalOneTimeTokenService } from '../patientPortal/auth/PortalOneTimeTokenService';

export class PortalCommunicationProcessor extends BaseCommunicationProcessor {
  constructor(context) {
    super(context, 'portalCommunicationProcessor', PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL);
  }

  async transformContent({ content, patientId, type }) {
    const { models } = this.context.store;
    const portalOneTimeTokenService = new PortalOneTimeTokenService(models);
    const portalUser = await models.PortalUser.findOne({ where: { patientId } });

    if (!portalUser) {
      throw new NotFoundError(`Could not find portal user with patient id ${patientId}`);
    }

    const portalUserId = portalUser.id;
    const baseUrl = config.patientPortal.portalUrl;

    // Send form link and login code to a registered user
    if (type === PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM) {
      const { token } = await portalOneTimeTokenService.createLoginToken(portalUserId);
      const loginLink = `${baseUrl}/login/${portalUserId}.${token}`;
      return replaceInTemplate(content, {
        loginLink,
        loginCode: token,
      });
    }

    const { token } = await portalOneTimeTokenService.createRegisterToken(portalUserId);
    const registrationLink = `${baseUrl}/register/${portalUserId}.${token}`;
    return replaceInTemplate(content, {
      registrationLink,
    });
  }
}
