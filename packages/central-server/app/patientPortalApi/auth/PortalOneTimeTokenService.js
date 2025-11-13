import { addMinutes } from 'date-fns';
import { randomInt, randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import config from 'config';
import { PORTAL_ONE_TIME_TOKEN_TYPES } from '@tamanu/constants';
import { InvalidCredentialError, InvalidTokenError } from '@tamanu/errors';

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
  constructor(models) {
    this.models = models;
  }

  async createLoginToken(portalUserId) {
    const { PortalOneTimeToken } = this.models;
    const token = randomSixDigitCode();
    const hashedToken = await hashPortalToken(token);
    const expiresAt = addMinutes(new Date(), config.patientPortal.loginTokenDurationMinutes);

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
    const expiresAt = addMinutes(new Date(), config.patientPortal.registerTokenDurationMinutes);

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
      throw new InvalidCredentialError('Invalid verification code');
    }

    const tokenRecord = await PortalOneTimeToken.findOne({
      where: { portalUserId, type },
      order: [['expiresAt', 'DESC']],
    });

    if (!tokenRecord) {
      throw new InvalidCredentialError('Invalid verification code');
    }

    if (tokenRecord.isExpired()) {
      throw new InvalidTokenError('Verification code has expired');
    }

    const isVerified = await bcrypt.compare(token, tokenRecord.token);

    if (!isVerified) {
      throw new InvalidCredentialError('Invalid verification code');
    }

    await tokenRecord.destroy({
      where: { id: tokenRecord.id },
      force: true,
    });

    return portalUser;
  }
}
