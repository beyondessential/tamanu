import { addMinutes } from 'date-fns';
import { BadAuthenticationError } from '@tamanu/shared/errors';

function randomSixDigitCode() {
  // returns a zero-padded 6 digit string
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Todo - discuss whether should this be utility functions, a class or just part of the model?
export const createForPortalUser = (models, portalUserId, expiryMinutes = 10) => {
  const { PortalOneTimeToken } = models;
  const token = randomSixDigitCode();
  const expiresAt = addMinutes(new Date(), expiryMinutes);

  return PortalOneTimeToken.create({ portalUserId, token, expiresAt }).then(record => ({
    token: record.token,
    expiresAt: record.expiresAt,
  }));
};

export const verifyAndConsume = async (models, { portalUserId, token }) => {
  const { OneTimeToken } = models;
  const record = await OneTimeToken.findOne({ where: { portalUserId, token } });

  if (!record) {
    throw new BadAuthenticationError('Invalid verification code');
  }

  if (record.isExpired()) {
    throw new BadAuthenticationError('Verification code has expired');
  }

  await record.destroy({ force: true });
  return { ok: true };
};

export class OneTimeTokenService {
  constructor(models, { expiryMinutes = 10 } = {}) {
    this.models = models;
    this.expiryMinutes = expiryMinutes;
  }

  createForPortalUser(portalUserId) {
    return createForPortalUser(this.models, portalUserId, this.expiryMinutes);
  }

  verifyAndConsume({ portalUserId, token }) {
    return verifyAndConsume(this.models, { portalUserId, token });
  }
}
