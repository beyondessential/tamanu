import { nanoid } from 'nanoid';
import { Op } from 'sequelize';
import { z } from 'zod';
import { ChatAnthropic } from '@langchain/anthropic';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { toJsonSchema } from '@langchain/core/utils/json_schema';

import { AI_CONTEXT_NAMES, AI_PROMPT_MARKERS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getSettingSecret, SecretNotConfiguredError } from '@tamanu/shared/utils/crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Every settings path init reads. A path missing here goes on needing a restart
// to take effect, so add to it alongside any new settings read.
export const AI_SETTING_PATHS = ['ai', 'experimentalAi', 'formBuilder'];

const SUMMARY_CONTEXTS = new Set([
  AI_CONTEXT_NAMES.PATIENT_SUMMARY,
  AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY,
]);

// Form builder contexts routed to the optional fast model when configured.
// Keep these to non-conversational structured/extraction/generation tasks
// where a smaller model is generally sufficient and latency dominates user
// experience. The build context generates a large structured response so it
// gets the biggest wall-time win from a faster model.
const FAST_MODEL_CONTEXTS = new Set([
  AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE,
  AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK,
  AI_CONTEXT_NAMES.FORM_BUILDER_BUILD,
]);

export const formBuilderChatResponseSchema = z.object({
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
        if (part?.type === 'thinking' || part?.type === 'redacted_thinking') return '';
        if (typeof part?.text === 'string') return part.text;
        return JSON.stringify(part);
      })
      .join('\n');
  }
  return String(content ?? '');
};

const TRANSCRIPT_ROLE_MARKERS = {
  human: AI_PROMPT_MARKERS.TRANSCRIPT_HUMAN,
  ai: AI_PROMPT_MARKERS.TRANSCRIPT_AI,
};

const sessionExpiry = () => new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

// Rebuild a LangChain message from a stored { role, content } turn.
const toLangChainMessage = ({ role, content }) => {
  if (role === 'system') return new SystemMessage(content);
  if (role === 'ai') return new AIMessage(content);
  return new HumanMessage(content);
};

// Claude 5.5 models reject a forced tool_choice, so the response tool is offered rather than forced,
// with one nudge if the model replies without it. The nudge doesn't replay the first reply: a
// tool_use in it would need a tool_result.
const invokeWithResponseTool = async (model, schema, name, messages) => {
  const jsonSchema = toJsonSchema(schema);
  const responseTool = {
    name,
    description: jsonSchema.description ?? `Respond only by calling the ${name} tool.`,
    input_schema: jsonSchema,
  };
  const boundModel = model.bindTools([responseTool], { tool_choice: 'auto' });
  const findToolCall = response => response.tool_calls?.find(call => call.name === name);

  const askAgain = () => {
    log.warn(`AIService: model ${model.model} answered without the ${name} tool, asking again`);
    return boundModel.invoke([...messages, new HumanMessage(`Respond by calling the ${name} tool.`)]);
  };

  const firstResponse = await boundModel.invoke(messages);
  const response = findToolCall(firstResponse) ? firstResponse : await askAgain();
  const toolCall = findToolCall(response);
  if (!toolCall) {
    const unparsed = response.invalid_tool_calls?.length ? ' (its arguments could not be parsed)' : '';
    throw new Error(`AI response did not call the ${name} tool${unparsed}`);
  }
  return schema.parse(toolCall.args);
};

export class AIService {
  /** @type {Map<string, string>} */
  contexts = new Map();

  /** @type {import('@tamanu/database').Models} */
  models;

  /** @type {import('@langchain/anthropic').ChatAnthropic | null} */
  summaryModel = null;

  /** @type {import('@langchain/anthropic').ChatAnthropic | null} */
  formBuilderModel = null;

  /** @type {import('@langchain/anthropic').ChatAnthropic | null} */
  formBuilderFastModel = null;

  /**
   * Built when either Experimental AI or the form builder is enabled with a
   * model. Each only registers the contexts it serves, so a disabled feature's
   * routes find nothing to call.
   *
   * @param {object} options
   * @param {import('@tamanu/settings').ReadSettings} options.settings
   * @param {import('@tamanu/database').Models} options.models
   */
  static async init({ settings, models }) {
    const experimentalAi = await settings.get('experimentalAi');
    const formBuilder = await settings.get('formBuilder');

    if (!experimentalAi.enabled && !formBuilder.enabled) {
      log.debug('AIService: disabled, skipping initialisation');
      return null;
    }

    let anthropicApiKey;
    try {
      anthropicApiKey = await getSettingSecret(settings, 'ai.anthropicApiKey');
    } catch (error) {
      if (!(error instanceof SecretNotConfiguredError)) throw error;
    }
    if (!anthropicApiKey) {
      log.debug('AIService: no Anthropic API key configured, skipping initialisation');
      return null;
    }

    const service = new AIService();
    service.models = models;

    const summaryModelName = experimentalAi.model?.trim();
    if (experimentalAi.enabled && !summaryModelName) {
      log.warn('AIService: no Experimental AI model configured, summaries unavailable');
    }
    if (experimentalAi.enabled && summaryModelName) {
      service.summaryModel = new ChatAnthropic({ anthropicApiKey, model: summaryModelName });
      if (experimentalAi.patientSummary.enabled) {
        service.registerContext(
          AI_CONTEXT_NAMES.PATIENT_SUMMARY,
          experimentalAi.patientSummary.prompts,
        );
      }
      if (experimentalAi.encounterSummary.enabled) {
        service.registerContext(
          AI_CONTEXT_NAMES.ENCOUNTER_SUMMARY,
          experimentalAi.encounterSummary.prompts,
        );
      }
      log.info(`AIService: summaries use model "${summaryModelName}"`);
    }

    const formBuilderModelName = formBuilder.model?.trim();
    if (formBuilder.enabled && !formBuilderModelName) {
      log.warn('AIService: no form builder model configured, form builder unavailable');
    }
    if (formBuilder.enabled && formBuilderModelName) {
      service.formBuilderModel = new ChatAnthropic({ anthropicApiKey, model: formBuilderModelName });
      const fastModelName = formBuilder.fastModel?.trim();
      service.formBuilderFastModel = fastModelName
        ? new ChatAnthropic({ anthropicApiKey, model: fastModelName })
        : service.formBuilderModel;
      service.registerFormBuilderContexts(formBuilder.prompts);
      log.info(
        `AIService: form builder uses model "${formBuilderModelName}"${fastModelName ? ` (fast model "${fastModelName}")` : ''}`,
      );
    }

    if (!service.summaryModel && !service.formBuilderModel) return null;
    return service;
  }

  /**
   * @param {string} name
   * @param {string} systemPrompt
   */
  registerContext(name, systemPrompt) {
    this.contexts.set(name, systemPrompt);
  }

  registerFormBuilderContexts({
    interpretFormImage,
    processMessage,
    buildSurveyDefinition,
    tweakSurveyDefinition,
  }) {
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER_IMAGE, interpretFormImage);
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER, processMessage);
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER_BUILD, buildSurveyDefinition);
    this.registerContext(AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK, tweakSurveyDefinition);
  }

  /**
   * @param {string} contextName
   * @returns {boolean}
   */
  hasContext(contextName) {
    return this.contexts.has(contextName);
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
   * @param {string} contextName
   * @returns {import('@langchain/anthropic').ChatAnthropic}
   */
  getModelForContext(contextName) {
    if (!this.hasContext(contextName)) {
      throw new Error(`AI context "${contextName}" is not registered`);
    }
    if (SUMMARY_CONTEXTS.has(contextName)) return this.summaryModel;
    if (FAST_MODEL_CONTEXTS.has(contextName)) return this.formBuilderFastModel;
    return this.formBuilderModel;
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

    const response = await invokeWithResponseTool(
      this.getModelForContext(AI_CONTEXT_NAMES.FORM_BUILDER),
      formBuilderChatResponseSchema,
      'form_builder_chat_response',
      [...session.messages.map(toLangChainMessage), new HumanMessage(userMessage)],
    );

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
      .map(message => {
        const roleMarker = TRANSCRIPT_ROLE_MARKERS[message.role];
        if (!roleMarker) {
          throw new Error(
            `AI session "${sessionId}" has a message with unknown role "${message.role}"`,
          );
        }
        return `${roleMarker}\n${normalizeMessageContent(message.content)}`;
      })
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
    return this.getModelForContext(contextName).invoke([
      new SystemMessage(this.getContext(contextName)),
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
  async invokeStructured(contextName, userMessage, schema, { name = 'extract' } = {}) {
    return invokeWithResponseTool(this.getModelForContext(contextName), schema, name, [
      new SystemMessage(this.getContext(contextName)),
      new HumanMessage(userMessage),
    ]);
  }
}
