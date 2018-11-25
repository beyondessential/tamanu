const admin = require('firebase-admin');
const { to } = require('await-to-js');
const serviceAccount = require('/Users/Personal/Documents/tamanu-6ac7d-firebase-adminsdk-f2s6b-6f7baae762.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://tamanu-6ac7d.firebaseio.com'
});

exports.sendNotification = async (token, data) => {
  return new Promise(async (resolve, reject) => {
      const message = {
        data, token
      };

      // Send a message to the device corresponding to the provided
      // registration token.
      const [err, res] = await to(admin.messaging().send(message));
      if (err) return reject(err);
      return resolve(res);
  });
};
