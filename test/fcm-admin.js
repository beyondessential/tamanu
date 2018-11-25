const admin = require('firebase-admin');
const serviceAccount = require('/Users/Personal/Documents/tamanu-6ac7d-firebase-adminsdk-f2s6b-6f7baae762.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tamanu-6ac7d.firebaseio.com"
});

// This registration token comes from the client FCM SDKs.
var registrationToken = 'eY0Zu_BAxsU:APA91bF-POq5NRHbUyXHUAhNb0FEVtQHyO8bKaE0TiU8YILe0IkVUK6KPA88Lec808QPqTIJu5_bW8M0c2dAZdsw5ovsjCW47S-HmYf3Jna6SAEL5UHnefQCosgk5xNm-6t_EueVwFTT';

// See documentation on defining a message payload.
var message = {
  data: {
    score: '850',
    time: '2:45'
  },
  token: registrationToken
};

// Send a message to the device corresponding to the provided
// registration token.
admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });