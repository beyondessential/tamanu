import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { NotFoundError } from '@tamanu/errors';
import { chat, sanitiseConfigForAi } from '@tamanu/shared/services/AskAiService';

export const askAi = express.Router();

askAi.use(
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
askAi.post(
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

// GET /ask-ai/conversations
askAi.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { models } = req;

    const conversations = await models.AskAiConversation.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.send({ data: conversations, count: conversations.length });
  }),
);

// GET /ask-ai/conversations/:id
askAi.get(
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
askAi.post(
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
    const appSettings = JSON.stringify(await req.settings[req.facilityId]?.getFrontEndSettings(), null, 2);

    const response = await chat({
      conversationId: conversation.id,
      userMessage: content,
      ragDatabaseUrl: askAiConfig.ragDatabaseUrl,
      models,
      voyageApiKey: askAiConfig.voyageApiKey,
      anthropicApiKey: askAiConfig.anthropicApiKey,
      ragNamespace: askAiConfig.ragNamespace,
      serverConfig,
      appSettings,
    });

    res.send(response);
  }),
);

// DELETE /ask-ai/conversations/:id
askAi.delete(
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
