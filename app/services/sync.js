const Faye = require('faye');
const { objectToJSON } = require('../utils');
const config = require('../../config');
const { outgoing } = require('../utils/faye-extensions');

class Sync {
  constructor(database, listeners) {
    this.database = database;
    this.listeners = listeners;
    this.client = new Faye.Client(config.sync.server);
    this.client.addExtension({
      outgoing: (message, callback) => outgoing({ database, message, callback })
    });
  }

  setup() {
    const clientId = this.database.getSetting('CLIENT_ID');
    const subscription = this.client.subscribe(`/${config.sync.channelIn}/${clientId}`).withChannel((channel, message) => {
      console.log(`[MessageIn - ${config.sync.channelIn}/${clientId}] - [${channel}]`, { action: message.action, type: message.recordType, id: message.recordId });
      // this.listeners.removeDatabaseListeners();
      switch (message.action) {
        case 'SAVE':
          this._saveRecord(message);
        break;
        case 'REMOVE':
          this._removeRecord(message);
        break;
        default:
          throw new Error('No action specified');
      }
      // this.listeners.addDatabaseListeners();
    });

    subscription.callback(() => {
      this.synchronize();
      console.log('[SUBSCRIBE SUCCEEDED]');
    });

    subscription.errback((error) => {
      console.log('[SUBSCRIBE FAILED]', error);
    });

    this.client.bind('transport:down', () => {
      console.log('[CONNECTION DOWN]');
    });

    this.client.bind('transport:up', () => {
      console.log('[CONNECTION UP]');
    });

    // subscription.then(() => {
    //   // Sync once the connection has been setup
    //   this.synchronize();
    //   console.log('[realm-sync] active');

    //   this.client.on('unsubscribe', (client, channel) => {
    //     console.log(`[UNSUBSCRIBE] ${client} -> ${channel}`);
    //   });

    //   this.client.on('disconnect', (client) => {
    //     console.log(`[DISCONNECT] ${client}`);
    //   });
    // });
  }

  synchronize() {
    try {
      const lastSyncTime = this.database.getSetting('LAST_SYNC_OUT');
      console.log('lastSyncTime', lastSyncTime);
      const changes = this.database.find('change', `timestamp >= "${lastSyncTime}"`);
      const tasks = [];
      changes.forEach(change => tasks.push(this._publishMessage(objectToJSON(change))));
      Promise.all(tasks);
    } catch (err) {
      throw new Error(err);
    }
  }

  async _publishMessage(change) {
    try {
      const clientId = this.database.getSetting('CLIENT_ID');
      let record = this.database.findOne(change.recordType, change.recordId);
      if (record) record = objectToJSON(record);
      await this.client.publish(`/${config.sync.channelOut}`, {
        from: clientId,
        record,
        ...change
      });

      // Update last sync out date
      this.database.setSetting('LAST_SYNC_OUT', new Date().getTime());
      console.log('[MessageOut]', `/${config.sync.channelOut}`, { action: change.action, type: change.recordType, id: change.recordId });
    } catch (err) {
      throw new Error(err);
    }
  }

  _saveRecord(props) {
    this.database.write(() => {
      this.database.create(props.recordType, props.record, true, true);
    });
  }

  _removeRecord(props) {
    this.database.write(() => {
      this.database.deleteByPrimaryKey(props.recordType, props.recordId, '_id', true);
    });
  }
}

module.exports = Sync;

// let _addListener;
// let _addTOQueue;
// let this._toJSON;
// const internals = {};
// internals.addDatabaseListeners = (realm) => {
  // const
  // console.log('addDatabaseListeners', dbName);
  // const dbUrl = `http://${config.localDB.username}:${config.localDB.password}@${config.localDB.host}:${config.localDB.port}`;
  // const couchFollowOpts = {
  //   db: `${dbUrl}/${dbName}`,
  //   include_docs: true,
  //   since: -1, // config.couchDbChangesSince,
  //   query_params: {
  //     conflicts: true,
  //   },
  // };

  // follow(couchFollowOpts, (error, change) => {
  //   console.log('follow', error, change);
  //   if (!error) {
  //     internals.pushSync(change);
  //   } else {
  //     console.error(error);
  //   }
  // });
// };

// internals.pushSync = (change) => {
//   const { pushDB } = dbService.getDBs();
//   const tasks = [];

//   pushDB.list({ include_docs: true }, async (err, subscriptions) => {
//     subscriptions.rows.forEach(async (subscriptionInfo) => {
//       //  && subscriptionInfo.doc.remoteSeq < change.seq
//       if (subscriptionInfo.doc && subscriptionInfo.doc.clientToken) {
//         const notificationInfo = {
//           seq: change.seq,
//           type: 'couchDBChange'
//         };

//         tasks.push(await pushHelper.sendNotification(subscriptionInfo.doc.clientToken, notificationInfo));

//         // pushHelper.sendNotification(subscriptionInfo.doc.subscription, notificationInfo).catch((err) => {
//         //   if (err.statusCode === 404 || err.statusCode === 410) {
//         //     pushDB.destroy(subscriptionInfo.doc._id, subscriptionInfo.doc._rev);
//         //   } else {
//         //     console.log('Subscription is no longer valid: ', err);
//         //   }
//         // });
//       }
//     });

//     try {
//       Promise.each(tasks, (value, index, length) => {
//         console.log('value', value);
//         console.log('index', index);
//         console.log('length', length);
//       });
//     } catch (er) {
//       console.error(er);
//     }

//     console.log('pushSync', tasks);
//   });
// };
