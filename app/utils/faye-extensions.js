const config = require('config');
const { head, startsWith } = require('lodash');

module.exports.incoming = ({ database, message, callback }) => {
  const { channel, ext } = message;
  const { clientId, clientSecret } = ext || {};
  if (startsWith(channel, `/${config.sync.channelIn}`) || channel === '/meta/subscribe') {
    const user = database.find('client', `clientId = "${clientId}" AND clientSecret = "${clientSecret}"`);
    if (!user || user.length <= 0) {
      message.error = 'User authentication failed!';
    }
  }
  // console.log('-incoming-', message);
  callback(message);
};
