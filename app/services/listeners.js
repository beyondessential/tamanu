const config = require('config');
const follow = require('follow');
const Promise = require('bluebird');
const dbService = require('../services/database');
const pushHelper = require('../helpers/pushHelper');

const internals = {};

internals.addDatabaseListeners = (dbName) => {
  console.log('addDatabaseListeners', dbName);
  const dbUrl = `http://${config.localDB.username}:${config.localDB.password}@${config.localDB.host}:${config.localDB.port}`;
  const couchFollowOpts = {
    db: `${dbUrl}/${dbName}`,
    include_docs: true,
    since: -1, // config.couchDbChangesSince,
    query_params: {
      conflicts: true,
    },
  };

  follow(couchFollowOpts, (error, change) => {
    console.log('follow', error, change);
    if (!error) {
      internals.pushSync(change);
    } else {
      console.error(error);
    }
  });
};

internals.pushSync = (change) => {
  const { pushDB } = dbService.getDBs();
  const tasks = [];

  pushDB.list({ include_docs: true }, async (err, subscriptions) => {
    subscriptions.rows.forEach(async (subscriptionInfo) => {
      //  && subscriptionInfo.doc.remoteSeq < change.seq
      if (subscriptionInfo.doc && subscriptionInfo.doc.clientToken) {
        const notificationInfo = {
          seq: change.seq,
          type: 'couchDBChange'
        };

        tasks.push(await pushHelper.sendNotification(subscriptionInfo.doc.clientToken, notificationInfo));

        // pushHelper.sendNotification(subscriptionInfo.doc.subscription, notificationInfo).catch((err) => {
        //   if (err.statusCode === 404 || err.statusCode === 410) {
        //     pushDB.destroy(subscriptionInfo.doc._id, subscriptionInfo.doc._rev);
        //   } else {
        //     console.log('Subscription is no longer valid: ', err);
        //   }
        // });
      }
    });

    try {
      Promise.each(tasks, (value, index, length) => {
        console.log('value', value);
        console.log('index', index);
        console.log('length', length);
      });
    } catch (er) {
      console.error(er);
    }

    console.log('pushSync', tasks);
  });
};

module.exports = internals;
