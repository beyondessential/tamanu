import config from 'config';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import fs from 'fs';
import { basename } from 'path';
import { COMMUNICATION_STATUSES } from 'shared/constants';
import { log } from 'shared/services/logging';

const fsPromises = fs.promises;
const mailgun = new Mailgun(formData);

const { apiKey, domain } = config.mailgun;

export class EmailService {
  constructor() {
    this.mailgunService =
      apiKey && domain ? mailgun({ usename: 'api', key: apiKey, url: domain }) : null;
  }

  async sendEmail({ attachment: untypedAttachment, ...email }) {
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

    let attachment;
    if (typeof attachment === 'string') {
      try {
        // pass mailgun file data instead of the path
        attachment = {
          data: await fsPromises(attachment),
          filename: basename(attachment),
        };
      } catch (e) {
        log.error('Could not read attachment for email', e);
        return {
          status: COMMUNICATION_STATUSES.ERROR,
          error: 'Attachment missing or unreadable',
        };
      }
    } else {
      attachment = untypedAttachment;
    }

    try {
      const emailResult = await this.mailgunService.messages.create({
        ...email,
        attachment,
      });
      return { status: COMMUNICATION_STATUSES.SENT, result: emailResult };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message };
    }
  }
}
