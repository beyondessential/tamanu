import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { NotFoundError } from '@tamanu/errors';
import { chat, sanitiseConfigForAi } from './AskAiService.js';

/**
 * Creates the Ask AI Express router.
 *
 * @param {(req: import('express').Request) => Promise<object|undefined>} getAppSettings
 *   Called in the POST messages handler to retrieve the front-end settings for
 *   the current server/facility. Facility server passes
 *   `req => req.settings[req.facilityId]?.getFrontEndSettings()`;
 *   central server passes `req => req.settings.getFrontEndSettings()`.
 */
// Pre-auth router — mounted before authMiddleware/authModule in both servers so
// the UI can discover whether the feature is on without a valid token.
export const askAiPublicRouter = express.Router();
askAiPublicRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    res.send({ enabled: Boolean(config.get('askAi').enabled) });
  }),
);

export const createAskAiRouter = getAppSettings => {
  const router = express.Router();

  router.use(
    asyncHandler(async (req, res, next) => {
      if (!config.get('askAi').enabled) {
        req.flagPermissionChecked();
        res.status(503).json({ error: 'Ask AI is not enabled on this server' });
        return;
      }
      next();
    }),
  );

  // POST /ask-ai/conversations
  router.post(
    '/conversations',
    asyncHandler(async (req, res) => {
      req.flagPermissionChecked();
      const { models } = req;
      const { title } = req.body;

      const conversation = await models.AskAiConversation.create({
        userId: req.user.id,
        title: title ?? 'New conversation',
      });

      res.send(conversation);
    }),
  );

  // GET /ask-ai/conversations?limit=50&offset=0
  router.get(
    '/conversations',
    asyncHandler(async (req, res) => {
      req.flagPermissionChecked();
      const { models } = req;

      const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 100);
      const offset = parseInt(req.query.offset ?? '0', 10);

      const { rows: conversations, count } = await models.AskAiConversation.findAndCountAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      res.send({ data: conversations, count });
    }),
  );

  // GET /ask-ai/conversations/:id
  router.get(
    '/conversations/:id',
    asyncHandler(async (req, res) => {
      req.flagPermissionChecked();
      const { models } = req;

      const conversation = await models.AskAiConversation.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!conversation) throw new NotFoundError();

      const messages = await models.AskAiMessage.findAll({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'ASC']],
      });

      res.send({ ...conversation.toJSON(), messages });
    }),
  );

  // POST /ask-ai/conversations/:id/messages
  router.post(
    '/conversations/:id/messages',
    asyncHandler(async (req, res) => {
      req.flagPermissionChecked();
      const { models } = req;
      const askAiConfig = config.get('askAi');

      const conversation = await models.AskAiConversation.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!conversation) throw new NotFoundError();

      const { content } = req.body;

      const serverConfig = JSON.stringify(sanitiseConfigForAi(config.util.toObject()), null, 2);
      const appSettings = JSON.stringify((await getAppSettings(req)) ?? {}, null, 2);

      const response = await chat({
        conversationId: conversation.id,
        userMessage: content,
        ragDatabaseUrl: askAiConfig.ragDatabaseUrl,
        models,
        voyageApiKey: askAiConfig.voyageApiKey,
        anthropicApiKey: askAiConfig.anthropicApiKey,
        serverConfig,
        appSettings,
      });

      res.send(response);
    }),
  );

  // DELETE /ask-ai/conversations/:id
  router.delete(
    '/conversations/:id',
    asyncHandler(async (req, res) => {
      req.flagPermissionChecked();
      const { models } = req;

      const conversation = await models.AskAiConversation.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!conversation) throw new NotFoundError();

      await conversation.destroy();

      res.send({});
    }),
  );

  return router;
};
