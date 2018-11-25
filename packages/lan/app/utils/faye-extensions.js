module.exports.outgoing = ({ database, message, callback }) => {
  const clientId = database.getSetting('CLIENT_ID');
  const clientSecret = database.getSetting('CLIENT_SECRET');
  if (clientId !== '' && clientSecret !== '') {
    message.ext = { clientId, clientSecret };
  } else {
    message.error = 'invalid request';
  }
  callback(message);
};
