import { addMinutes } from 'date-fns';
import { randomInt, randomBytes, createHash } from 'crypto';
import { PORTAL_ONE_TIME_TOKEN_TYPES } from '@tamanu/constants';
import { BadAuthenticationError } from '@tamanu/shared/errors';

function randomSixDigitCode() {
  // returns a zero-padded 6 digit string using crypto.randomInt for better security
  return Array.from({ length: 6 }, () => randomInt(0, 9)).join('');
}

function randomRegisterCode() {
  // secure random code for magic links - 32 hex chars
  return randomBytes(16).toString('hex');
}

export function hashPortalToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export class PortalOneTimeTokenService {
  constructor(models, { expiryMinutes = 10 } = {}) {
    this.models = models;
    this.expiryMinutes = expiryMinutes;
  }

  async createLoginToken(portalUserId) {
    const { PortalOneTimeToken } = this.models;
    const token = randomSixDigitCode();
    const hashedToken = hashPortalToken(token);
    const expiresAt = addMinutes(new Date(), this.expiryMinutes);

    // Overwrite existing login tokens for this user
    await PortalOneTimeToken.destroy({
      where: { portalUserId, type: PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN },
      force: true,
    });

    const record = await PortalOneTimeToken.create({
      portalUserId,
      type: PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN,
      token: hashedToken,
      expiresAt,
    });
    return {
      token,
      expiresAt: record.expiresAt,
    };
  }

  async createRegisterToken(portalUserId) {
    const { PortalOneTimeToken } = this.models;
    const token = randomRegisterCode();
    const hashedToken = hashPortalToken(token);
    const expiresAt = addMinutes(new Date(), this.expiryMinutes);

    // Overwrite existing register tokens for this user
    await PortalOneTimeToken.destroy({
      where: { portalUserId, type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER },
      force: true,
    });

    const record = await PortalOneTimeToken.create({
      portalUserId,
      type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER,
      token: hashedToken,
      expiresAt,
    });
    return {
      token,
      expiresAt: record.expiresAt,
    };
  }

  async verifyAndConsume({ token, type = PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN }) {
    const { PortalOneTimeToken, PortalUser } = this.models;
    const hashedToken = hashPortalToken(token);
    const record = await PortalOneTimeToken.findOne({
      where: { type, token: hashedToken },
    });

    if (!record) {
      throw new BadAuthenticationError('Invalid verification code');
    }

    if (record.isExpired()) {
      throw new BadAuthenticationError('Verification code has expired');
    }

    const portalUser = await PortalUser.findByPk(record.portalUserId);
    if (!portalUser) {
      throw new BadAuthenticationError('Invalid verification code');
    }

    await record.destroy({
      where: { portalUserId: portalUser.id, type },
      force: true,
    });
    return portalUser;
  }
}
