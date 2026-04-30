import { nanoid } from 'nanoid';
import { ChatAnthropic } from '@langchain/anthropic';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';

import { log } from '@tamanu/shared/services/logging';

const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

export class AIService {
  /** @type {Map<string, string>} */
  contexts = new Map();

  /**
   * @type {Map<string, { history: InMemoryChatMessageHistory, lastAccessedAt: number, pending: Promise<void> }>}
   */
  sessions = new Map();

  /** @type {import('@langchain/anthropic').ChatAnthropic} */
  chatModel;

  /** @type {RunnableWithMessageHistory} */
  conversationChain;

  /** @type {ReturnType<typeof setInterval> | null} */
  _sweepInterval = null;

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
      getMessageHistory: (sessionId) => {
        const session = service.sessions.get(sessionId);
        if (!session) {
          throw new Error(`AI session "${sessionId}" not found`);
        }
        return session.history;
      },
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    });

    service._sweepInterval = setInterval(
      () => service._sweepStaleSessions(),
      SESSION_SWEEP_INTERVAL_MS,
    );
    service._sweepInterval.unref();

    // TODO: Register default contexts here when contexts are available in settings
    // eg: service.registerContext('survey-builder', settings.get('ai.survey-builder.context'));

    log.info(`AIService: initialised with model "${anthropicModel}"`);
    return service;
  }

  _sweepStaleSessions() {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [sessionId, session] of this.sessions) {
      if (session.lastAccessedAt < cutoff) {
        this.sessions.delete(sessionId);
      }
    }
  }

  close() {
    if (this._sweepInterval !== null) {
      clearInterval(this._sweepInterval);
      this._sweepInterval = null;
    }
    this.sessions.clear();
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
    this.sessions.set(sessionId, { history, lastAccessedAt: Date.now(), pending: Promise.resolve() });
    return sessionId;
  }

  /**
   * Send a user message within an existing session.
   * History is managed automatically by RunnableWithMessageHistory.
   * Invocations are serialised per session to prevent history corruption from concurrent calls.
   *
   * @param {string} sessionId
   * @param {string} userMessage
   * @returns {Promise<import('@langchain/core/messages').AIMessage>}
   */
  async sendMessage(sessionId, userMessage) {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`AI session "${sessionId}" not found`);
    }
    const session = this.sessions.get(sessionId);
    session.lastAccessedAt = Date.now();
    const result = session.pending.then(() =>
      this.conversationChain.invoke(
        { input: userMessage },
        { configurable: { sessionId } },
      ),
    );
    // Update pending so the next sendMessage call waits for this one to finish.
    // Errors are suppressed on the chain itself so a failed call doesn't block future ones.
    session.pending = result.then(() => {}).catch(() => {});
    return result;
  }

  /**
   * Delete a session and free its history.
   *
   * @param {string} sessionId
   */
  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
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
