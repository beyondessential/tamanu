import { MissingCredentialError } from '@tamanu/errors';

export const requireClientHeaders = (req, res, next) => {
  if (!req.get('x-tamanu-client')) {
    next(new MissingCredentialError('Must pass an x-tamanu-client header'));
    return;
  }
  if (!req.get('x-version')) {
    next(new MissingCredentialError('Must pass an x-version header'));
    return;
  }
  next();
};
