import { nanoid } from 'nanoid';
import NodeCache from 'node-cache';
import { z } from 'zod';
import { ChatAnthropic } from '@langchain/anthropic';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';

import { log } from '@tamanu/shared/services/logging';
import { getSettingSecret, SecretNotConfiguredError } from '@tamanu/shared/utils/crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const FORM_BUILDER_CONTEXT = 'formBuilder';
const FORM_BUILDER_BUILD_CONTEXT = 'formBuilderBuildSurveyDefinition';
const FORM_BUILDER_TWEAK_CONTEXT = 'formBuilderTweakSurveyDefinition';
const FORM_BUILDER_IMAGE_CONTEXT = 'formBuilderInterpretFormImage';
const FORM_BUILDER_FIX_CONTEXT = 'formBuilderFixProgramErrors';

// Contexts routed to the optional faster Anthropic model when configured.
// Keep these to non-conversational structured/extraction/generation tasks
// where a smaller model is generally sufficient and latency dominates user
// experience. The build context generates a large structured response so it
// gets the biggest wall-time win from a faster model.
const FAST_MODEL_CONTEXTS = new Set([
  FORM_BUILDER_IMAGE_CONTEXT,
  FORM_BUILDER_TWEAK_CONTEXT,
  FORM_BUILDER_FIX_CONTEXT,
  FORM_BUILDER_BUILD_CONTEXT,
]);

const formBuilderChatResponseSchema = z.object({
  message: z.string().describe('The assistant message to display to the implementer.'),
  attach_to_program_code: z
    .string()
    .nullable()
    .describe('The selected program code, "__new__", or null if not yet selected.'),
  ready_to_export: z
    .boolean()
    .describe('True when the conversation is ready for a human-readable export.'),
  ready_to_generate: z
    .boolean()
    .describe('True when the conversation is ready to generate an importable ProgramDefinition.'),
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

export class AIService {
  /** @type {Map<string, string>} */
  contexts = new Map();

  /** @type {NodeCache} */
  sessions = new NodeCache({ stdTTL: SESSION_TTL_SECONDS, checkperiod: 300, useClones: false });

  /** @type {import('@langchain/anthropic').ChatAnthropic} */
  chatModel;

  /** @type {import('@langchain/anthropic').ChatAnthropic} */
  fastChatModel;

  /** @type {RunnableWithMessageHistory} */
  conversationChain;

  /**
   * @param {object} options
   * @param {import('@tamanu/settings').ReadSettings} options.settings
   */
  static async init({ settings }) {
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
    service.chatModel = new ChatAnthropic({
      anthropicApiKey,
      model: anthropicModel,
    });
    const fastModelName = anthropicFastModel?.trim();
    service.fastChatModel = fastModelName
      ? new ChatAnthropic({ anthropicApiKey, model: fastModelName })
      : service.chatModel;

    const prompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    service.conversationChain = new RunnableWithMessageHistory({
      runnable: prompt.pipe(service.chatModel),
      getMessageHistory: sessionId => {
        const session = service.sessions.get(sessionId);
        if (!session) {
          throw new Error(`AI session "${sessionId}" not found`);
        }
        return session;
      },
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    });

    await service.registerFormBuilderContext(settings);

    if (fastModelName && fastModelName !== anthropicModel) {
      log.info(
        `AIService: initialised with model "${anthropicModel}" (fast model "${fastModelName}")`,
      );
    } else {
      log.info(`AIService: initialised with model "${anthropicModel}"`);
    }
    return service;
  }

  close() {
    this.sessions.close();
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
   * Register the AI form builder context from settings. This is called once on
   * startup, then explicitly after settings changes.
   *
   * @param {import('@tamanu/settings').ReadSettings} settings
   */
  async registerFormBuilderContext(settings) {
    const { interpretFormImage, processMessage, buildSurveyDefinition, tweakSurveyDefinition } =
      await settings.get('formBuilder.prompts');
    this.registerContext(FORM_BUILDER_IMAGE_CONTEXT, interpretFormImage);
    this.registerContext(FORM_BUILDER_CONTEXT, processMessage);
    this.registerContext(FORM_BUILDER_BUILD_CONTEXT, buildSurveyDefinition);
    this.registerContext(FORM_BUILDER_TWEAK_CONTEXT, tweakSurveyDefinition);
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
   * Create a new multi-turn conversation session using a registered context.
   *
   * @param {string} contextName
   * @returns {Promise<string>} sessionId
   */
  async createSession(contextName) {
    const sessionId = nanoid();
    const history = new InMemoryChatMessageHistory();
    await history.addMessage(new SystemMessage(this.getContext(contextName)));
    this.sessions.set(sessionId, history);
    return sessionId;
  }

  /**
   * Send a user message within an existing session.
   * History is managed automatically by RunnableWithMessageHistory.
   *
   * @param {string} sessionId
   * @param {string} userMessage
   * @returns {Promise<import('@langchain/core/messages').AIMessage>}
   */
  async sendMessage(sessionId, userMessage) {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`AI session "${sessionId}" not found`);
    }
    this.sessions.ttl(sessionId, SESSION_TTL_SECONDS); // refresh TTL on access
    return this.conversationChain.invoke({ input: userMessage }, { configurable: { sessionId } });
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
    const history = this.sessions.get(sessionId);
    if (!history) {
      throw new Error(`AI session "${sessionId}" not found`);
    }

    this.sessions.ttl(sessionId, SESSION_TTL_SECONDS);
    const structuredModel = this.chatModel.withStructuredOutput(formBuilderChatResponseSchema, {
      name: 'form_builder_chat_response',
    });
    const response = await structuredModel.invoke([
      ...(await history.getMessages()),
      new HumanMessage(userMessage),
    ]);

    await history.addMessage(new HumanMessage(userMessage));
    await history.addMessage(new AIMessage(JSON.stringify(response)));

    return response;
  }

  async addSessionMessages(sessionId, { userMessage, assistantMessage }) {
    const history = this.sessions.get(sessionId);
    if (!history) {
      throw new Error(`AI session "${sessionId}" not found`);
    }

    this.sessions.ttl(sessionId, SESSION_TTL_SECONDS);
    await history.addMessage(new HumanMessage(userMessage));
    await history.addMessage(new AIMessage(assistantMessage));
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
    const response = await this.getModelForContext(FORM_BUILDER_IMAGE_CONTEXT).invoke([
      new SystemMessage(this.getContext(FORM_BUILDER_IMAGE_CONTEXT)),
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
    const response = await this.getModelForContext(FORM_BUILDER_IMAGE_CONTEXT).invoke([
      new SystemMessage(this.getContext(FORM_BUILDER_IMAGE_CONTEXT)),
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
    const history = this.sessions.get(sessionId);
    if (!history) {
      throw new Error(`AI session "${sessionId}" not found`);
    }

    return (await history.getMessages())
      .filter(message => message._getType?.() !== 'system')
      .map(message => `[${message._getType?.() ?? 'message'}]\n${normalizeMessageContent(message.content)}`)
      .join('\n\n');
  }

  /**
   * Stateless structured invocation using a registered context.
   *
   * @param {string} contextName
   * @param {string} userMessage
   * @param {import('zod').ZodTypeAny} schema
   * @param {object} [options]
   * @param {string} [options.name]
   * @param {object} [invokeOptions]
   * @param {AbortSignal} [invokeOptions.signal]
   * @returns {Promise<unknown>}
   */
  async invokeStructured(contextName, userMessage, schema, options = {}, invokeOptions = {}) {
    const structuredModel = this.getModelForContext(contextName).withStructuredOutput(
      schema,
      options,
    );
    return structuredModel.invoke(
      [new SystemMessage(this.getContext(contextName)), new HumanMessage(userMessage)],
      invokeOptions,
    );
  }

  /**
   * Delete a session and free its history.
   *
   * @param {string} sessionId
   */
  deleteSession(sessionId) {
    this.sessions.del(sessionId);
  }

  /**
   * Stateless one-shot invocation using a registered context.
   *
   * @param {string} contextName
   * @param {string} userMessage
   * @returns {Promise<import('@langchain/core/messages').AIMessage>}
   */
  async invoke(contextName, userMessage) {
    return this.getModelForContext(contextName).invoke([
      new SystemMessage(this.getContext(contextName)),
      ['human', userMessage],
    ]);
  }
}
