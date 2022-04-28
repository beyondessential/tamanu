import config from 'config';
import mailgun from 'mailgun-js';
import { COMMUNICATION_STATUSES } from 'shared/constants';
import { log } from 'shared/services/logging';
import { createReadStream } from 'fs';

const { apiKey, domain } = config.mailgun;

async function getReadStreamSafe(path) {
  return new Promise((resolve, reject) => {
    // Mailgun doesn't do any error handling internally, so we
    // take charge of opening the attachment, and just pass the
    // stream to mailgun instead of the path.

    const readStream = createReadStream(path);

    // Don't return the stream until it's actually successfully opened
    readStream.on('open', () => resolve(readStream));

    // Handle any errors with a reject (if this handler isn't assigned,
    // node will panic and exit regardless of any try/catch wrappers!)
    readStream.on('error', e => reject(e));
  });
}

export class EmailService {
  constructor() {
    this.mailgunService = apiKey && domain ? mailgun({ apiKey, domain }) : null;
  }

  async sendEmail({ attachment, ...email }) {
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

    let attachmentStream;
    if (attachment) {
      try {
        // pass mailgun a readable stream instead of the path
        attachmentStream = await getReadStreamSafe(attachment);
      } catch (e) {
        log.error('Could not read attachment for email', e);
        return {
          status: COMMUNICATION_STATUSES.ERROR,
          error: 'Attachment missing or unreadable',
        };
      }
    }

    try {
      const emailResult = await this.mailgunService.messages().send({
        ...email,
        attachment: attachmentStream,
      });
      return { status: COMMUNICATION_STATUSES.SENT, result: emailResult };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message };
    }
  }
}
