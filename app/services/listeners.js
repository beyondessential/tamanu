const { each } = require('lodash');
const models = require('../models');
const QueueManager = require('./queue-manager');
const Sync = require('./sync');

class Listeners {
  constructor(database) {
    this.database = database;
    this.sync = new Sync(database, this);
    this.queueManager = new QueueManager(database);
    this.collections = {};

    // Setup sync
    this.sync.setup();
    this.sync.synchronize();
    this.queueManager.on('change', () => this.sync.synchronize());
  }

  addDatabaseListeners() {
    each(models, (model) => {
      if (model.sync !== false) this._addListener(model.name);
    });
    console.log('Database listeners added!');
  }

  removeDatabaseListeners() {
    each(models, (model) => {
      if (model.sync !== false) this._removeListener(model.name);
    });
    console.log('Database listeners removed!');
  }

  _addListener(recordType) {
    const objects = this.database.objects(recordType);
    let items = this._toJSON(objects);
    this.collections[recordType] = objects;
    objects.addListener((itemsUpdated, changes) => {
      each(changes, (indexes, actionType) => {
        switch (actionType) {
          case 'insertions':
          case 'newModifications':
          case 'modifications':
          case 'oldModifications':
            indexes.forEach((index) => {
              this.queueManager.push({
                action: 'SAVE',
                recordId: itemsUpdated[index]._id,
                recordType
              });
            });
            items = this._toJSON(itemsUpdated);
          break;
          case 'deletions':
            indexes.forEach((index) => {
              this.queueManager.push({
                action: 'REMOVE',
                recordId: items[index]._id,
                recordType
              });
            });
            items = this._toJSON(itemsUpdated);
          break;
          default:
            console.log(`Ignoring ${actionType}`);
          break;
        }
      });
    });
  }

  _removeListener(recordType) {
    this.collections[recordType].removeAllListeners();
  }

  _toJSON(object) {
   return JSON.parse(JSON.stringify(object));
  }
}

module.exports = Listeners;

// let __addListener;
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
