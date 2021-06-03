import config from 'config';
import mailgun from 'mailgun-js';
import { COMMUNICATION_STATUSES } from 'shared/constants';

const { apiKey, domain, toAddressOverride } = config.mailgun;
const mailgunService = apiKey && domain ? mailgun({ apiKey, domain }) : null;
export async function sendEmail(email) {
  // no mailgun service, unable to send email
  if (!mailgunService) {
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

  let resolvedTo = email.to;
  let resolvedSubject = email.subject;

  if (process.env.NODE_ENV !== 'production') {
    if (!toAddressOverride) {
      throw new Error('Must specify toAddressOverride in non-prod environments');
    }
    resolvedTo = toAddressOverride;
    resolvedSubject += ` (${email.to})`;
  }

  const resolvedEmail = { ...email, to: resolvedTo, subject: resolvedSubject };

  try {
    const emailResult = await mailgunService.messages().send(resolvedEmail);
    return { status: COMMUNICATION_STATUSES.SENT, result: emailResult };
  } catch (e) {
    return { status: COMMUNICATION_STATUSES.ERROR, error: e.message };
  }
}
