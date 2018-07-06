module.exports = {
  port: 4000,
  db: {
    host: 'localhost',
    user: 'couchadmin',
    password: 'test',
    port: 5990,
  },
  mainCouchServer: `http://${require('ip').address()}:3500`,
  couchPubSubUrl: 'http://localhost:3000/couch-sync'
};

// const ip = require('ip');
