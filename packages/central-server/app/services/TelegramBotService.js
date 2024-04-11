import TelegramBot from 'node-telegram-bot-api';
import config from 'config';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

const { telegramBot, canonicalHostName, language = 'en' } = config;
const apiToken = telegramBot?.apiToken;
const secretToken = telegramBot?.secretToken;

const TELEGRAM_MESSAGE_TYPES = {
  START: '/start',
};

export class TelegramBotService {
  static #bot = apiToken ? new TelegramBot(apiToken) : null;

  constructor(context, options) {
    this.context = context;
    if (options?.autoStartWebhook) {
      this.startWebhook();
    }
  }

  initListener() {
    TelegramBotService.#bot?.on('message', this.handleMessage.bind(this));
  }

  handleMessage(msg) {
    if (!TelegramBotService.#bot || !msg?.text) return;
    if (msg.text.startsWith(TELEGRAM_MESSAGE_TYPES.START)) {
      this.registerNewContact(msg);
    }
  }

  async registerNewContact(msg) {
    const { models } = this.context.store;
    const getTranslation = await models.TranslatedString.getTranslationFunction(language);

    const botInfo = await TelegramBotService.#bot.getMe();
    const chatId = msg.chat.id;
    const contactName = msg.from.first_name + (msg.from.last_name ? ` ${msg.from.last_name}` : '');

    // TODO: Check added contact successfully then send message and add patientName to translation text
    this.sendMessage(
      chatId,
      getTranslation(
        'telegramRegistration.successMessage',
        `Dear :contactName, you have successfully registered to receive messages for <patientName> from :botName. Thank you.`,
        { contactName, botName: botInfo.first_name },
      ),
    );
  }

  startWebhook() {
    if (!TelegramBotService.#bot) return;
    TelegramBotService.#bot
      .setWebHook(`${canonicalHostName}/api/public/telegram-webhook`, {
        secret_token: secretToken,
      })
      .catch(e => {
        log.error('Start telegram webhook failed', {
          canonicalHostName,
          error: e.message,
        });
      });
  }

  processUpdate(body) {
    TelegramBotService.#bot?.processUpdate(body);
  }

  async sendMessage(chatId, text) {
    if (!TelegramBotService.#bot) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: 'Telegram bot service not found' };
    }
    try {
      const message = await TelegramBotService.#bot.sendMessage(chatId, text);
      return { status: COMMUNICATION_STATUSES.SENT, result: message };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message };
    }
  }
}
