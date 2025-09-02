import config from 'config';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { PATIENT_COMMUNICATION_CHANNELS, PATIENT_COMMUNICATION_TYPES } from '@tamanu/constants';
import { BaseCommunicationProcessor } from './BaseCommunicationProcessor';
import { PortalOneTimeTokenService } from '../patientPortal/auth/PortalOneTimeTokenService';

export class PortalCommunicationProcessor extends BaseCommunicationProcessor {
  constructor(context) {
    super(context, 'portalCommunicationProcessor', PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL);
  }

  async transformContent({ content, patientId, type }) {
    const { models } = this.context.store;
    const portalUser = await models.PortalUser.findOne({ where: { patientId } });
    const portalOneTimeTokenService = new PortalOneTimeTokenService(models);

    const portalUserId = portalUser.id;
    let token;

    if (type === PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM) {
      ({ token } = await portalOneTimeTokenService.createLoginToken(portalUserId));
    } else {
      ({ token } = await portalOneTimeTokenService.createRegisterToken(portalUserId));
    }
    console.log('config.portalHostName', config);

    const registrationLink = `${config.portalHostName}/register/${portalUserId}.${token}`;

    return replaceInTemplate(content, {
      registrationLink,
    });
  }
}
