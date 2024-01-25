import { InvalidClientHeadersError } from '@tamanu/shared/errors';

export const requireClientHeaders = (req, res, next) => {
  const client = req.header('X-Tamanu-Client');
  const version = req.header('X-Version');
  if (!client) {
    next(new InvalidClientHeadersError(`Must pass an X-Tamanu-Client header`));
    return;
  }
  if (!version) {
    next(new InvalidClientHeadersError(`Must pass an X-Version header`));
    return;
  }
  next();
};
