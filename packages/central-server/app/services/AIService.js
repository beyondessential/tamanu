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

const CONTEXT_SETTINGS_KEY = {
  [AI_CONTEXT_NAMES.PATIENT_SUMMARY]: 'patientSummary',
};

export class AIService {
  /** @type {import('@tamanu/settings').ReadSettings} */
  settings;

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
    service.settings = settings;
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

    log.info(`AIService: initialised with model "${anthropicModel}"`);
    return service;
  }

  close() {
    this.sessions.close();
  }

  /**
   * Resolve the system prompt for a context by reading from settings,
   * so admin changes take effect without a restart.
   *
   * @param {string} contextName
   * @returns {Promise<string>}
   */
  async getContext(contextName) {
    const settingsKey = CONTEXT_SETTINGS_KEY[contextName];
    if (!settingsKey) {
      throw new Error(`AI context "${contextName}" is not registered`);
    }
    const { prompts } = await this.settings.get(settingsKey);
    return prompts;
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
    await history.addMessage(new SystemMessage(await this.getContext(contextName)));
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
      new SystemMessage(await this.getContext(contextName)),
      ['human', userMessage],
    ]);
  }
}
