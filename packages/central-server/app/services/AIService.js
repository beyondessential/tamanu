import { nanoid } from 'nanoid';
import { Op } from 'sequelize';
import { z } from 'zod';
import { ChatAnthropic } from '@langchain/anthropic';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { AI_CONTEXT_NAMES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getSettingSecret, SecretNotConfiguredError } from '@tamanu/shared/utils/crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Contexts routed to the optional faster Anthropic model when configured.
// Keep these to non-conversational structured/extraction/generation tasks
// where a smaller model is generally sufficient and latency dominates user
// experience. The build context generates a large structured response so it
// gets the biggest wall-time win from a faster model.
const FAST_MODEL_CONTEXTS = new Set([
  AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE,
  AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK,
  AI_CONTEXT_NAMES.FORM_BUILDER_BUILD,
]);

const formBuilderChatResponseSchema = z.object({
  message: z.string().describe('The assistant message to display to the implementer.'),
  attach_to_program_code: z
    .string()
    .nullable()
    .describe('The selected program code, "__new__", or null if not yet selected.'),
  ready: z
    .boolean()
    .describe(
      'True when the conversation has gathered enough information to generate a ProgramDefinition preview (or to export the current questions for human review).',
    ),
});

const normalizeMessageContent = content => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return JSON.stringify(part);
      })
      .join('\n');
  }
  return String(content ?? '');
};

const sessionExpiry = () => new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

// Rebuild a LangChain message from a stored { role, content } turn.
const toLangChainMessage = ({ role, content }) => {
  if (role === 'system') return new SystemMessage(content);
  if (role === 'ai') return new AIMessage(content);
  return new HumanMessage(content);
};

export class AIService {
  /** @type {Map<string, string>} */
  contexts = new Map();

  /** @type {import('@tamanu/database').Models} */
  models;

  /** @type {import('@langchain/anthropic').ChatAnthropic} */
  chatModel;

  /** @type {import('@langchain/anthropic').ChatAnthropic} */
  fastChatModel;

  /**
   * @param {object} options
   * @param {import('@tamanu/settings').ReadSettings} options.settings
   * @param {import('@tamanu/database').Models} options.models
   */
  static async init({ settings, models }) {
    const { enabled, anthropicModel, anthropicFastModel } = await settings.get('ai');

    if (!enabled) {
      log.info('AIService: disabled, skipping initialisation');
      return null;
    }

    let anthropicApiKey;
    try {
      anthropicApiKey = await getSettingSecret(settings, 'ai.anthropicApiKey');
    } catch (error) {
      if (error instanceof SecretNotConfiguredError) {
        log.info('AIService: no Anthropic API key configured, skipping initialisation');
        return null;
      }
      throw error;
    }

    if (!anthropicApiKey) {
      log.info('AIService: no Anthropic API key configured, skipping initialisation');
      return null;
    }

    const service = new AIService();
    service.models = models;
    service.chatModel = new ChatAnthropic({
      anthropicApiKey,
      model: anthropicModel,
    });
    const fastModelName = anthropicFastModel?.trim();
    service.fastChatModel = fastModelName
      ? new ChatAnthropic({ anthropicApiKey, model: fastModelName })
      : service.chatModel;

    await service.refreshContexts(settings);

    if (fastModelName && fastModelName !== anthropicModel) {
      log.info(
        `AIService: initialised with model "${anthropicModel}" (fast model "${fastModelName}")`,
      );
    } else {
      log.info(`AIService: initialised with model "${anthropicModel}"`);
    }
    return service;
  }

  /**
   * Register a named context (system prompt). Call once per feature at startup.
   *
   * @param {string} name
   * @param {string} systemPrompt
   */
  registerContext(name, systemPrompt) {
    this.contexts.set(name, systemPrompt);
  }

  /**
   * Refresh all settings-backed AI contexts. This is called once on startup,
   * then explicitly after settings changes.
   *
   * @param {import('@tamanu/settings').ReadSettings} settings
   */
  async refreshContexts(settings) {
    await this.registerFormBuilderContext(settings);
  }

  /**
   * Register the AI form builder context from settings.
   *
   * @param {import('@tamanu/settings').ReadSettings} settings
   */
  async registerFormBuilderContext(settings) {
    const { interpretFormImage, processMessage, buildSurveyDefinition, tweakSurveyDefinition } =
      await settings.get('formBuilder.prompts');
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE, interpretFormImage);
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER, processMessage);
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER_BUILD, buildSurveyDefinition);
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK, tweakSurveyDefinition);
  }

  /**
   * @param {string} contextName
   * @returns {string}
   */
  getContext(contextName) {
    if (!this.contexts.has(contextName)) {
      throw new Error(`AI context "${contextName}" is not registered`);
    }
    return this.contexts.get(contextName);
  }

  /**
   * Pick the right chat model for the given context. Non-conversational
   * structured/extraction/generation tasks route to the fast model when one is
   * configured; everything else stays on the main conversational model.
   *
   * @param {string} contextName
   * @returns {import('@langchain/anthropic').ChatAnthropic}
   */
  getModelForContext(contextName) {
    if (FAST_MODEL_CONTEXTS.has(contextName)) return this.fastChatModel;
    return this.chatModel;
  }

  /**
   * Find a session that hasn't expired. Sessions are persisted so any central
   * process can resolve them (they used to be in-memory and per-process, so a
   * sessionId was lost on restart or when a request landed on another process).
   *
   * @param {string} sessionId
   * @returns {Promise<import('@tamanu/database').Models['AiChatSession'] | null>}
   */
  async findActiveSession(sessionId) {
    if (!sessionId) return null;
    return this.models.AiChatSession.findOne({
      where: { id: sessionId, expiresAt: { [Op.gt]: new Date() } },
    });
  }

  async getActiveSessionOrThrow(sessionId) {
    const session = await this.findActiveSession(sessionId);
    if (!session) {
      throw new Error(`AI session "${sessionId}" not found`);
    }
    return session;
  }

  /**
   * Create a new multi-turn conversation session using a registered context.
   *
   * @param {string} contextName
   * @returns {Promise<string>} sessionId
   */
  async createSession(contextName) {
    const sessionId = nanoid();
    await this.models.AiChatSession.create({
      id: sessionId,
      contextName,
      messages: [{ role: 'system', content: this.getContext(contextName) }],
      expiresAt: sessionExpiry(),
    });
    return sessionId;
  }

  /**
   * Whether a non-expired session exists. Callers use this to fall back to a
   * fresh session instead of erroring on a stale sessionId.
   *
   * @param {string} sessionId
   * @returns {Promise<boolean>}
   */
  async hasSession(sessionId) {
    return Boolean(await this.findActiveSession(sessionId));
  }

  /**
   * Send a form builder chat message and enforce the structured response
   * contract described in the form builder prompt settings.
   *
   * @param {string} sessionId
   * @param {string} userMessage
   * @returns {Promise<z.infer<typeof formBuilderChatResponseSchema>>}
   */
  async sendFormBuilderMessage(sessionId, userMessage) {
    const session = await this.getActiveSessionOrThrow(sessionId);

    const structuredModel = this.chatModel.withStructuredOutput(formBuilderChatResponseSchema, {
      name: 'form_builder_chat_response',
    });
    const response = await structuredModel.invoke([
      ...session.messages.map(toLangChainMessage),
      new HumanMessage(userMessage),
    ]);

    await session.update({
      messages: [
        ...session.messages,
        { role: 'human', content: userMessage },
        { role: 'ai', content: JSON.stringify(response) },
      ],
      expiresAt: sessionExpiry(),
    });

    return response;
  }

  async addSessionMessages(sessionId, { userMessage, assistantMessage }) {
    const session = await this.getActiveSessionOrThrow(sessionId);

    await session.update({
      messages: [
        ...session.messages,
        { role: 'human', content: userMessage },
        { role: 'ai', content: assistantMessage },
      ],
      expiresAt: sessionExpiry(),
    });
  }

  /**
   * Interpret an uploaded form image using the form builder image prompt setting.
   *
   * @param {object} options
   * @param {string} options.imageBase64
   * @param {string} options.mediaType
   * @param {string} [options.fileName]
   * @returns {Promise<string>}
   */
  async interpretFormBuilderImage({ imageBase64, mediaType, fileName }) {
    const response = await this.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE).invoke([
      new SystemMessage(this.getContext(AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE)),
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: `Interpret the uploaded form image${fileName ? ` "${fileName}"` : ''}.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`,
            },
          },
        ],
      }),
    ]);

    return normalizeMessageContent(response.content);
  }

  /**
   * Interpret an uploaded form PDF using the form builder image/document prompt setting.
   *
   * @param {object} options
   * @param {string} options.pdfBase64
   * @param {string} [options.fileName]
   * @returns {Promise<string>}
   */
  async interpretFormBuilderPdf({ pdfBase64, fileName }) {
    const response = await this.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE).invoke([
      new SystemMessage(this.getContext(AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE)),
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: `Interpret the uploaded form PDF${fileName ? ` "${fileName}"` : ''}.`,
          },
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
        ],
      }),
    ]);

    return normalizeMessageContent(response.content);
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<string>}
   */
  async getSessionTranscript(sessionId) {
    const session = await this.getActiveSessionOrThrow(sessionId);

    return session.messages
      .filter(message => message.role !== 'system')
      .map(message => `[${message.role}]\n${normalizeMessageContent(message.content)}`)
      .join('\n\n');
  }

    /**
   * Stateless one-shot invocation using a registered context.
   *
   * @param {string} contextName
   * @param {string} userMessage
   * @returns {Promise<import('@langchain/core/messages').AIMessage>}
   */
    async invoke(contextName, userMessage) {
      return this.chatModel.invoke([
        new SystemMessage(await this.getContext(contextName)),
        ['human', userMessage],
      ]);
    }

  /**
   * Stateless structured invocation using a registered context.
   *
   * @param {string} contextName
   * @param {string} userMessage
   * @param {import('zod').ZodTypeAny} schema
   * @param {object} [options]
   * @param {string} [options.name]
   * @returns {Promise<unknown>}
   */
  async invokeStructured(contextName, userMessage, schema, options = {}) {
    const structuredModel = this.getModelForContext(contextName).withStructuredOutput(
      schema,
      options,
    );
    return structuredModel.invoke([
      new SystemMessage(this.getContext(contextName)),
      new HumanMessage(userMessage),
    ]);
  }
}
