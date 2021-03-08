import { COMMUNICATION_STATUSES } from 'shared/constants';

export async function sendEmail(email) {
  // TODO: Implement integration with email service
  await sleep(200);
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
  return { status: COMMUNICATION_STATUSES.SENT };
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
