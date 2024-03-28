import TelegramBot from 'node-telegram-bot-api';
import config from 'config';

const { telegramBot, canonicalHostName } = config;
const apiToken = telegramBot?.apiToken;
const secretToken = telegramBot?.secretToken;

export class TelegramBotService {
  static #bot = new TelegramBot(apiToken);

  constructor(options) {
    TelegramBotService.#bot.on('message', async (msg, meta) => this.handleMessage(msg, meta));
    if (options?.autoStartWebhook) {
      this.startWebhook();
    }
  }

  handleMessage(msg) {
    const chatId = msg.chat.id;
    TelegramBotService.#bot.sendMessage(chatId, `You just say: ${msg.text}`);
  }

  startWebhook() {
    TelegramBotService.#bot.setWebHook(`${canonicalHostName}/api/public/telegram-webhook`, {
      secret_token: secretToken,
    });
  }

  processUpdate(body) {
    TelegramBotService.#bot.processUpdate(body);
  }
}
