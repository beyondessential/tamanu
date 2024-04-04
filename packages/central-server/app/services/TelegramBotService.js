import TelegramBot from 'node-telegram-bot-api';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';

const { telegramBot, canonicalHostName } = config;
const apiToken = telegramBot?.apiToken;
const secretToken = telegramBot?.secretToken;

export class TelegramBotService {
  static #bot = apiToken ? new TelegramBot(apiToken) : null;

  constructor(options) {
    if (options?.autoStartWebhook) {
      this.startWebhook();
    }
  }

  initListener() {
    TelegramBotService.#bot?.on('message', async (msg, meta) => this.handleMessage(msg, meta));
  }

  handleMessage(msg) {
    const chatId = msg.chat.id;
    TelegramBotService.#bot?.sendMessage(chatId, `You just say: \n${msg.text}`);
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
}
