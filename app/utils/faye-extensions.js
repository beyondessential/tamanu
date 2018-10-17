const config = require('config');
const { head, startsWith } = require('lodash');

module.exports.incoming = ({ database, message, callback }) => {
  const { channel, ext } = message;
  const { clientId, clientSecret } = ext || {};
  if (startsWith(channel, `/${config.sync.channelIn}`) || channel === '/meta/subscribe') {
    const user = database.find('user', `_id = "${clientId}" AND secret = "${clientSecret}"`);
    if (!user || user.length <= 0) {
      message.error = 'User authentication failed!';
    } else {
      message.ext = head(user);
    }
  }
  callback(message);
};
