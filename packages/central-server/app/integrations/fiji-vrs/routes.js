import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { set } from 'es-toolkit/compat';

import { buildErrorHandler } from '../../middleware/errorHandler';
import { requireClientHeaders } from '../../middleware/requireClientHeaders';
import { VRSRemote } from './VRSRemote';
import { VRSActionHandler } from './VRSActionHandler';

const vrsErrorHandler = buildErrorHandler(error => ({
  response: false,
  error: {
    message: error.message,
    ...error,
  },
}));

// Built per boot (rather than at import time) so the header requirement can come from settings.
export const routes = async ctx => {
  const router = express.Router();

  if ((await ctx.settings.get('integrations.fijiVrs')).requireClientHeaders) {
    router.use(requireClientHeaders);
  }

  router.post(
    '/hooks/patientCreated',
    asyncHandler(async (req, res) => {
      const { body, ctx: requestCtx } = req;
      await requestCtx.integrations.fijiVrs.actionHandler.applyAction(body);
      res.send({ response: true });
    }),
  );

  router.use(vrsErrorHandler);
  return router;
};

export const initAppContext = async ctx => {
  // Behaviour knobs are settings; the connection details (host, username, password) are
  // deployment wiring and stay in config.
  const { host, username, password } = config.integrations.fijiVrs;
  const vrsConfig = {
    host,
    username,
    password,
    ...(await ctx.settings.get('integrations.fijiVrs')),
  };
  const remote = new VRSRemote(ctx.store, vrsConfig);
  const actionHandler = new VRSActionHandler(ctx.store, remote, vrsConfig);
  set(ctx, 'integrations.fijiVrs.remote', remote); // added to context to help make testing easier
  set(ctx, 'integrations.fijiVrs.actionHandler', actionHandler);
};
