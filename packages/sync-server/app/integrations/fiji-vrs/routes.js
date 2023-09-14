import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { set } from 'lodash';

import { buildErrorHandler } from '../../middleware/errorHandler';
import { requireClientHeaders as requireClientHeadersMiddleware } from '../../middleware/requireClientHeaders';
import { VRSRemote } from './VRSRemote';
import { VRSActionHandler } from './VRSActionHandler';

const vrsErrorHandler = buildErrorHandler(error => ({
  response: false,
  error: {
    message: error.message,
    ...error,
  },
}));

export const routes = (_context, requireClientHeaders) => {
  const router = express.Router();
  if (requireClientHeaders) {
    routes.use(requireClientHeadersMiddleware);
  }
  routes.post(
    '/hooks/patientCreated',
    asyncHandler(async (req, res) => {
      const { body, ctx } = req;
      await ctx.integrations.fijiVrs.actionHandler.applyAction(body);
      res.send({ response: true });
    }),
  );

  routes.use(vrsErrorHandler);
  return router;
};

export const initAppContext = async ctx => {
  const vrsConfig = config.integrations.fijiVrs;
  const remote = new VRSRemote(ctx.store, vrsConfig);
  const actionHandler = new VRSActionHandler(ctx.store, remote, vrsConfig);
  set(ctx, 'integrations.fijiVrs.remote', remote); // added to context to help make testing easier
  set(ctx, 'integrations.fijiVrs.actionHandler', actionHandler);
};
