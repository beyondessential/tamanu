const config = require('config');
const { head, startsWith } = require('lodash');

module.exports.incoming = ({ database, message, callback }) => {
  const { channel, ext } = message;
  const { clientId, clientSecret } = ext || {};
  if (startsWith(channel, `/${config.sync.channelIn}`) || channel === '/meta/subscribe') {
    let user = database.find('client', `clientId = "${clientId}" AND clientSecret = "${clientSecret}"`);
    if (user && user.length > 0) {
      user = head(user);
      message.ext = user;
      database.write(() => {
        user.lastActive = new Date().getTime();
      });
      if (channel === '/meta/subscribe') console.log(`Client subscribed ${user._id}`);
    } else {
      message.error = 'User authentication failed!';
      console.warn('User authentication failed!');
    }
  }
  callback(message);
};
