const config = require('config');
const { objectToJSON, incoming } = require('../utils');

class Sync {
  constructor(database, faye) {
    this.database = database;
    this.client = faye; // new Faye.Client(`http://127.0.0.1:${config.app.port}/${config.syncPath}`);
    this.client.addExtension({
      incoming: (message, callback) => incoming({ database, message, callback })
    });
  }

  setup() {
    const clients = this.database.find('client');
    clients.forEach(client => this._addSubscriber(client));
  }

  synchronize() {
    const clients = this.database.find('client', 'active = "true"');
    clients.forEach(client => this._sync(client));
  }

  _sync(client) {
    try {
      const lastSyncTime = client.syncOut;
      const changes = this.database.find('change', `timestamp >= "${lastSyncTime}"`);
      const tasks = [];
      changes.forEach(change => tasks.push(this._publishMessage(objectToJSON(change), client)));
      Promise.all(tasks);
      // Update sync date
      this.database.write(() => {
        client.syncOut = new Date().getTime();
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  _addSubscriber(client) {
    this.client.on('publish', (clientId, channel, message) => {
      if (channel === `/${config.sync.channelIn}/${client.clientId}`) {
        console.log(`[MessageIn - ${config.sync.channelIn}]`, { action: message.action, type: message.recordType, id: message.recordId });
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
      }
    });

    this.client.on('subscribe', (clientId, channel) => {
      this.database.write(() => {
        client.active = true;
      });
      this._sync(client);
      console.log(`[SUBSCRIBE - ${client.clientId}] ${clientId} -> ${channel}`);
    });

    this.client.on('unsubscribe', (clientId, channel) => {
      this.database.write(() => {
        client.active = false;
      });
      console.log(`[UNSUBSCRIBE - ${client.clientId}] ${clientId} -> ${channel}`);
    });

    this.client.on('disconnect', (clientId) => {
      this.database.write(() => {
        client.active = false;
      });
      console.log(`[DISCONNECT - ${client.clientId}] ${clientId}`);
    });
  }

  async _publishMessage(change, client) {
    try {
      let record = this.database.findOne(change.recordType, change.recordId);
      if (record) record = objectToJSON(record);
      await this.client.getClient().publish(`/${config.sync.channelOut}/${client.clientId}`, {
        record,
        ...change
      });

      console.log('[MessageOut]', { action: change.action, type: change.recordType, id: change.recordId });
      return {};
    } catch (err) {
      throw new Error(err);
    }
  }

  _saveRecord(props) {
    this.database.write(() => {
      this.database.create(props.recordType, props.record, true);
    });
  }

  _removeRecord(props) {
    this.database.write(() => {
      this.database.deleteByPrimaryKey(props.recordType, props.recordId);
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
