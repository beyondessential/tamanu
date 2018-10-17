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
    const hospitals = this.database.objects('hospital');
    hospitals.forEach(hospital => this._addSubscriber(hospital));
  }

  synchronize() {
    try {
      const lastSyncTime = this.database.getSetting('LAST_SYNC_OUT');
      const changes = this.database.find('change', `timestamp >= "${lastSyncTime}"`);
      const tasks = [];
      changes.forEach(change => tasks.push(this._publishMessage(objectToJSON(change))));
      Promise.all(tasks);
    } catch (err) {
      throw new Error(err);
    }
  }

  _addSubscriber(hospital) {
    const subscription = this.client.getClient().subscribe(`/${config.sync.channelIn}/${hospital._id}`, (message) => {
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
    });

    subscription.then(() => {
      console.log(`[realm-sync - ${hospital.name}] active`);
    });

    this.client.on('subscribe', (clientId, channel) => {
      console.log(`[SUBSCRIBE - ${hospital.name}] ${clientId} -> ${channel}`);
    });

    this.client.on('unsubscribe', (clientId, channel) => {
      console.log(`[UNSUBSCRIBE - ${hospital.name}] ${clientId} -> ${channel}`);
    });

    this.client.on('disconnect', (clientId) => {
      console.log(`[DISCONNECT - ${hospital.name}] ${clientId}`);
    });
  }

  async _publishMessage(change) {
    try {
      let record = this.database.findOne(change.recordType, change.recordId);
      if (record) record = objectToJSON(record);
      await this.client.getClient().publish(`/${config.sync.channelOut}`, {
        record,
        ...change
      });

      // Update last sync out date
      this.database.setSetting('LAST_SYNC_OUT', new Date().getTime());
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
