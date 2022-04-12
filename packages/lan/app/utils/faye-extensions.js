export const outgoing = ({ database, message, callback }) => {
  const msg = message;

  const clientId = database.getSetting('CLIENT_ID');
  const clientSecret = database.getSetting('CLIENT_SECRET');
  if (clientId !== '' && clientSecret !== '') {
    msg.ext = { clientId, clientSecret };
  } else {
    msg.error = 'invalid request';
  }

  callback(msg);
};
