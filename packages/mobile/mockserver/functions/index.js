const functions = require('firebase-functions');
const server = require('./mockserver');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.api = functions.https.onRequest(server);
