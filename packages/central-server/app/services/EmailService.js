import config from 'config';
import nodemailer from 'nodemailer';
import { createReadStream } from 'fs';
import { basename } from 'path';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { mailgunTransport } from './mailgunTransport.js';

function createTransporter() {
  // When `mail.transport` is set, it is passed through to nodemailer.createTransport()
  // unchanged, so any SMTP option (host/port/secure/auth, service shortcuts, pooling, etc.)
  // or nodemailer transport plugin can be used. See https://nodemailer.com/transports/.
  if (config.mail?.transport) {
    return nodemailer.createTransport(config.mail.transport);
  }

  // Legacy `mailgun` config: route the Mailgun HTTP API through nodemailer too, so there
  // is a single send path regardless of which backend is configured.
  const { apiKey, domain, url } = config.mailgun ?? {};
  if (apiKey && domain) {
    return nodemailer.createTransport(mailgunTransport({ apiKey, domain, url }));
  }

  return null;
}

async function openReadStream(path) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(path);
    stream.on('open', () => resolve(stream));
    stream.on('error', reject);
  });
}

async function resolveAttachments(attachment) {
  // Unified attachment shape -> nodemailer's:
  //   - string path        -> [{ content: stream, filename }]
  //   - { data, filename } -> [{ content: data, filename }]
  //   - array              -> passed through (nodemailer native)
  if (attachment == null) return undefined;
  if (Array.isArray(attachment)) return attachment;
  if (typeof attachment === 'string') {
    // Eagerly open the file so a missing/unreadable path surfaces as a clean error before
    // we hand off to the transport.
    const stream = await openReadStream(attachment);
    return [{ content: stream, filename: basename(attachment) }];
  }
  if (typeof attachment !== 'object' || attachment.data == null || !attachment.filename) {
    throw new Error('Attachment object must have `data` and `filename`');
  }
  const { data, filename } = attachment;
  return [{ content: data, filename }];
}

function shouldRetrySendError(e) {
  // SMTP reply codes use 4xx for transient failures and 5xx for permanent ones, so a 4xx
  // response is worth retrying. Mailgun's HTTP API (mailgun.js) uses standard HTTP
  // semantics — 5xx is server-side and retryable, 4xx is a client error we shouldn't
  // hammer. Anything else (network/unknown) falls through to a retry.
  if (typeof e.responseCode === 'number') return e.responseCode >= 400 && e.responseCode < 500;
  if (typeof e.status === 'number') return e.status >= 500;
  return true;
}

export class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  /**
   * Send an email via the configured transport.
   *
   * @param {object} email - `from`, `to`, `subject` are required; other fields
   *   (`text`, `html`, `cc`, `bcc`, `replyTo`, etc.) are passed through to nodemailer.
   * @param {string | { data: any, filename?: string } | Array<object> | null} [email.attachment]
   *   Unified attachment shape: a filesystem path string, a `{ data, filename }` object
   *   (where `data` is a Buffer/stream/string), or an array of native nodemailer
   *   attachments. Use `null`/`undefined` for no attachment.
   * @returns {Promise<{ status: string, result?: any, error?: string, shouldRetry?: boolean }>}
   */
  async sendEmail({ attachment, ...email }) {
    if (!this.transporter) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: 'Email service not configured' };
    }
    if (!email.from) {
      return { status: COMMUNICATION_STATUSES.BAD_FORMAT, error: 'Missing from address' };
    }
    if (!email.to) {
      return { status: COMMUNICATION_STATUSES.BAD_FORMAT, error: 'Missing to address' };
    }
    if (!email.subject) {
      return { status: COMMUNICATION_STATUSES.BAD_FORMAT, error: 'Missing subject' };
    }

    let attachments;
    try {
      attachments = await resolveAttachments(attachment);
    } catch (e) {
      log.error('Could not read attachment for email', e);
      return { status: COMMUNICATION_STATUSES.ERROR, error: 'Attachment missing or unreadable' };
    }

    try {
      const result = await this.transporter.sendMail({ ...email, attachments });
      return { status: COMMUNICATION_STATUSES.SENT, result };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message, shouldRetry: shouldRetrySendError(e) };
    }
  }
}
