import config from 'config';
import mailgun from 'mailgun-js';
import { COMMUNICATION_STATUSES } from 'shared/constants';

const { apiKey, domain, toAddressOverride } = config.mailgun;

export class EmailService {
  constructor() {
    this.mailgunService = apiKey && domain ? mailgun({ apiKey, domain }) : null;
  }

  async sendEmail(email) {
    // no mailgun service, unable to send email
    if (!this.mailgunService) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: 'Email service not found' };
    }
    if (!email.from) {
      return {
        status: COMMUNICATION_STATUSES.BAD_FORMAT,
        error: 'Missing from address',
      };
    }
    if (!email.to) {
      return {
        status: COMMUNICATION_STATUSES.BAD_FORMAT,
        error: 'Missing to address',
      };
    }
    if (!email.subject) {
      return {
        status: COMMUNICATION_STATUSES.BAD_FORMAT,
        error: 'Missing subject',
      };
    }

    try {
      const emailResult = await this.mailgunService.messages().send(email);
      return { status: COMMUNICATION_STATUSES.SENT, result: emailResult };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message };
    }
  }
}
