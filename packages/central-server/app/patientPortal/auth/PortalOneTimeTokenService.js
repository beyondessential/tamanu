import { addMinutes } from 'date-fns';
import { randomInt, randomBytes, createHash } from 'crypto';
import { BadAuthenticationError } from '@tamanu/shared/errors';

function randomSixDigitCode() {
  // returns a zero-padded 6 digit string using crypto.randomInt for better security
  return randomInt(100000, 1000000).toString();
}

function randomRegisterCode() {
  // secure random code for magic links - 32 hex chars
  return randomBytes(16).toString('hex');
}

function hashToken(token) {
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
    const hashedToken = hashToken(token);
    const expiresAt = addMinutes(new Date(), this.expiryMinutes);

    // Overwrite existing login tokens for this user
    await PortalOneTimeToken.destroy({ where: { portalUserId, type: 'login' }, force: true });

    const record = await PortalOneTimeToken.create({
      portalUserId,
      type: 'login',
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
    const hashedToken = hashToken(token);
    const expiresAt = addMinutes(new Date(), this.expiryMinutes);

    // Overwrite existing register tokens for this user
    await PortalOneTimeToken.destroy({ where: { portalUserId, type: 'register' }, force: true });

    const record = await PortalOneTimeToken.create({
      portalUserId,
      type: 'register',
      token: hashedToken,
      expiresAt,
    });
    return {
      token,
      expiresAt: record.expiresAt,
    };
  }

  async verifyAndConsume({ token, type = 'login' }) {
    const { PortalOneTimeToken, PortalUser } = this.models;
    const hashedToken = hashToken(token);
    const record = await PortalOneTimeToken.findOne({
      where: { type, token: hashedToken },
    });

    if (!record) {
      throw new BadAuthenticationError('Invalid verification code');
    }

    const portalUser = await PortalUser.findOne({ id: record.portalUserId });

    if (!portalUser) {
      throw new BadAuthenticationError('Invalid email or password');
    }

    if (record.isExpired()) {
      throw new BadAuthenticationError('Verification code has expired');
    }

    await record.destroy({ force: true });
    return portalUser;
  }
}
