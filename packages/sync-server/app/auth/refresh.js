import config from 'config';
import asyncHandler from 'express-async-handler';
import { getToken } from './utils';

export const refresh = ({ secret }) =>
  asyncHandler(async (req, res) => {
    const { user } = req;
    const token = await getToken(user, secret, config.auth.tokenDuration);
    res.send({ token });
  });
