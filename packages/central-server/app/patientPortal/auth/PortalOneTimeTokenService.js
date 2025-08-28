import { addMinutes } from 'date-fns';
import { randomInt, randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { PORTAL_ONE_TIME_TOKEN_TYPES } from '@tamanu/constants';
import { BadAuthenticationError } from '@tamanu/shared/errors';

const DEFAULT_SALT_ROUNDS = 10;

function randomSixDigitCode() {
  // returns a zero-padded 6 digit string using crypto.randomInt for better security
  return Array.from({ length: 6 }, () => randomInt(0, 9)).join('');
}

function randomRegisterCode() {
  // secure random code for magic links - 32 hex chars
  return randomBytes(16).toString('hex');
}

export async function hashPortalToken(token) {
  return bcrypt.hash(token, DEFAULT_SALT_ROUNDS);
}

export class PortalOneTimeTokenService {
  constructor(models, { expiryMinutes = 10 } = {}) {
    this.models = models;
    this.expiryMinutes = expiryMinutes;
  }

  async createLoginToken(portalUserId) {
    const { PortalOneTimeToken } = this.models;
    const token = randomSixDigitCode();
    const hashedToken = await hashPortalToken(token);
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
    const hashedToken = await hashPortalToken(token);
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

  async verifyAndConsume({ portalUserId, token, type = PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN }) {
    const { PortalOneTimeToken, PortalUser } = this.models;

    const portalUser = await PortalUser.findByPk(portalUserId);
    if (!portalUser) {
      throw new BadAuthenticationError('Invalid verification code');
    }

    const tokenRecord = await PortalOneTimeToken.findOne({
      where: { portalUserId, type },
      order: [['expiresAt', 'DESC']],
    });

    if (!tokenRecord) {
      throw new BadAuthenticationError('Invalid verification code');
    }

    if (tokenRecord.isExpired()) {
      throw new BadAuthenticationError('Verification code has expired');
    }

    const isVerified = await bcrypt.compare(token, tokenRecord.token);

    if (!isVerified) {
      throw new BadAuthenticationError('Invalid verification code');
    }

    await tokenRecord.destroy({
      where: { id: tokenRecord.id },
      force: true,
    });

    return portalUser;
  }
}
