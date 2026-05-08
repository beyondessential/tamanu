import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { createReadStream } from 'fs';

// Minimal nodemailer transport plugin that routes mail through the Mailgun HTTP API via
// mailgun.js. Kept inline so we can stay on the latest mailgun.js — the upstream wrapper
// `nodemailer-mailgun-transport` pins it to v8 and hasn't been updated since 2022.
export function mailgunTransport({ apiKey, domain, url }) {
  const messages = new Mailgun(FormData).client({ username: 'api', key: apiKey, url }).messages;
  return {
    name: 'Mailgun',
    version: '1.0.0',
    send({ data: mail }, callback) {
      try {
        const body = toMailgunMessage(mail);
        messages
          .create(domain, body)
          .then(result => callback(null, { ...result, messageId: result.id }))
          .catch(callback);
      } catch (e) {
        callback(e);
      }
    },
  };
}

// RFC 5322 specials that force a display-name to be a quoted-string.
const DISPLAY_NAME_SPECIALS = /[()<>[\]:;@\\,."]/;

function formatDisplayName(name) {
  if (!DISPLAY_NAME_SPECIALS.test(name)) return name;
  // A quoted-string: wrap in double quotes, escape backslashes and double quotes.
  return `"${name.replace(/([\\"])/g, '\\$1')}"`;
}

function formatAddressList(value) {
  if (!value) return undefined;
  const list = [].concat(value).filter(Boolean).map(item => {
    if (typeof item === 'string') return item;
    if (!item.address) return null;
    return item.name ? `${formatDisplayName(item.name)} <${item.address}>` : item.address;
  }).filter(Boolean);
  return list.length ? list.join(',') : undefined;
}

function toMailgunAttachment(a) {
  let data;
  if (a.content != null) {
    data = typeof a.content === 'string' && a.encoding ? Buffer.from(a.content, a.encoding) : a.content;
  } else if (a.path) {
    data = createReadStream(a.path);
  }
  return {
    data,
    filename: a.cid || a.filename,
    contentType: a.contentType,
    knownLength: a.knownLength,
  };
}

function toMailgunMessage(mail) {
  const out = {};

  for (const key of ['subject', 'text', 'html']) {
    if (mail[key]) out[key] = mail[key];
  }
  for (const key of ['from', 'to', 'cc', 'bcc']) {
    const formatted = formatAddressList(mail[key]);
    if (formatted) out[key] = formatted;
  }
  const replyTo = formatAddressList(mail.replyTo);
  if (replyTo) out['h:Reply-To'] = replyTo;
  if (mail.messageId) out['h:Message-Id'] = mail.messageId;

  const [inline, attachment] = (mail.attachments ?? []).reduce(
    ([inlines, regulars], a) => {
      const converted = toMailgunAttachment(a);
      return a.cid ? [inlines.concat(converted), regulars] : [inlines, regulars.concat(converted)];
    },
    [[], []],
  );
  if (attachment.length) out.attachment = attachment;
  if (inline.length) out.inline = inline;

  return out;
}
