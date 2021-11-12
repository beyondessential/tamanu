import config from 'config';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { log } from 'shared/services/logging';

export const TOKEN_TYPES = {
  DEFAULT: 'DEFAULT',
  FIJI_VRS: 'FIJI_VRS',
};

const DEFAULT_JWT_SECRET = config.auth.secret || uuid();
const FIJI_VRS_JWT_SECRET = config.integrations.fijiVrs.secret;

if (config.integrations.fijiVrs.enabled && !FIJI_VRS_JWT_SECRET) {
  log.error(
    `Auth: fijiVrs integration enabled but no secret set! VRS API tokens will not be able to be issued or validated`,
  );
}

export const FAKE_TOKEN = 'fake-token';

export const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

export const getToken = (user, expiry, maybeType = TOKEN_TYPES.DEFAULT) => {
  const { type, secret } = getTokenInfoFromType(maybeType);
  return jwt.sign(
    {
      userId: user.id,
      type,
    },
    secret,
    { expiresIn: expiry },
  );
};

const getTokenInfoFromType = maybeType => {
  const type = TOKEN_TYPES[maybeType];
  const secret = {
    [TOKEN_TYPES.DEFAULT]: DEFAULT_JWT_SECRET,
    [TOKEN_TYPES.FIJI_VRS]: FIJI_VRS_JWT_SECRET,
  }[type];
  return { secret, type };
};

const getTokenInfoFromToken = token => {
  // TODO: tests
  // note that this DOES NOT VERIFY THE PAYLOAD
  // DO NOT TRUST THE CONTENTS except insofar as they specify a valid type
  const unsafeContents = jwt.decode(token);
  const unsafeType = unsafeContents?.type;
  return getTokenInfoFromType(unsafeType);
};

export const verifyToken = token => {
  const { secret } = getTokenInfoFromToken(token);
  return jwt.verify(token, secret);
};
