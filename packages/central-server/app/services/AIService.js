import { nanoid } from 'nanoid';
import NodeCache from 'node-cache';
import { ChatAnthropic } from '@langchain/anthropic';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';

import { log } from '@tamanu/shared/services/logging';
import { AI_CONTEXT_NAMES } from '@tamanu/constants';

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export class AIService {
  /** @type {Map<string, string>} */
  contexts = new Map();

  /** @type {NodeCache} */
  sessions = new NodeCache({ stdTTL: SESSION_TTL_SECONDS, checkperiod: 300, useClones: false });

  /** @type {import('@langchain/anthropic').ChatAnthropic} */
  chatModel;

  /** @type {RunnableWithMessageHistory} */
  conversationChain;

  /**
   * @param {object} options
   * @param {import('@tamanu/settings').ReadSettings} options.settings
   */
  static async init({ settings }) {
    const { enabled, anthropicApiKey, anthropicModel } = await settings.get('ai');

    if (!enabled) {
      log.info('AIService: disabled, skipping initialisation');
      return null;
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

    await service.registerAllContexts(settings);

    log.info(`AIService: initialised with model "${anthropicModel}"`);
    return service;
  }

  close() {
    this.sessions.close();
  }

  async registerAllContexts(settings) {
    const { patientSummarySystemPrompt } = await settings.get('ai');
    this.registerContext(AI_CONTEXT_NAMES.PATIENT_SUMMARY, patientSummarySystemPrompt);
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
    return this.chatModel.invoke([
      new SystemMessage(this.getContext(contextName)),
      ['human', userMessage],
    ]);
  }
}
