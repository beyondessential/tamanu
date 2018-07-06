const config = require('config');
const follow = require('follow');
const Promise = require('bluebird');
const uuid = require('uuid');
const { to } = require('await-to-js');
const dbService = require('../services/database');
const pushHelper = require('../helpers/pushHelper');

const internals = {};

internals.addDatabaseListeners = (dbName, bayeux) => {
  console.log('addDatabaseListeners', dbName);
  const dbUrl = `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`;
  const couchFollowOpts = {
    db: `${dbUrl}/${dbName}`,
    include_docs: true,
    since: -1, // config.couchDbChangesSince,
    query_params: {
      conflicts: true,
    },
  };

  follow(couchFollowOpts, async (error, change) => {
    // console.log('follow', error, change);
    if (!error) {
      internals.pushSync(change, bayeux);
      internals.mergeConflicts(change, bayeux);

      // if (err) console.error(err);
    } else {
      console.error(error);
    }
  });
};

internals.pushSync = async (change, bayeux) => {
  // const { pushDB } = dbService.getDBs();
  // const tasks = [];

  const [err] = await to(bayeux.getClient().publish('/couchDBChange', {
    seq: change.seq
  }));

//   pushDB.list({ include_docs: true }, async (err, subscriptions) => {
//     subscriptions.rows.forEach(async (subscriptionInfo) => {
//       //  && subscriptionInfo.doc.remoteSeq < change.seq
//       if (subscriptionInfo.doc && subscriptionInfo.doc.clientToken) {
//         const notificationInfo = {
//           seq: change.seq,
//           type: 'couchDBChange'
//         };

//         tasks.push(bayeux.getClient().publish('/couchDBChange', {
//           text: 'New email has arrived!',
//           inboxSize: 34
//         }));

//         console.log('err', err);
//         console.log('subscriptionInfo', subscriptionInfo);
// hgn
//         // tasks.push(await pushHelper.sendNotification(subscriptionInfo.doc.clientToken, notificationInfo));
//         // pushHelper.sendNotification(subscriptionInfo.doc.subscription, notificationInfo).catch((err) => {
//         //   if (err.statusCode === 404 || err.statusCode === 410) {
//         //     pushDB.destroy(subscriptionInfo.doc._id, subscriptionInfo.doc._rev);
//         //   } else {
//         //     console.log('Subscription is no longer valid: ', err);
//         //   }
//         // });
//       }
//     });

//     // try {
//     //   Promise.each(tasks, (value, index, length) => {
//     //     console.log('value', value);
//     //     console.log('index', index);
//     //     console.log('length', length);
//     //   });
//     // } catch (er) {
//     //   console.error(er);
//     // }

//     console.log('pushSync', tasks);
//   });
};

internals.mergeConflicts = (change) => {
  // console.log('-mergeConflicts-', change);
  if (change.doc && change.doc._conflicts) {
    const conflicts = change.doc._conflicts;
    const currentDoc = change.doc;
    internals._resolveConflicts(change.id, conflicts, currentDoc, (err) => {
      if (err) console.log(`ERROR resolving conflicts: ${JSON.stringify(err, null, 2)}`);
    });
  }
};


internals._resolveConflicts = (conflictId, conflicts, currentDoc, callback) => {
  const { maindb } = dbService.getDBs();

  maindb.get(conflictId, { open_revs: JSON.stringify(conflicts, null, 2) }, (err, body) => {
    let compareObj;
    let currentModifiedDate;
    let i;
    let key;
    let modifiedDate;
    let updateProperty;
    const updateDocument = false;
    const originalDoc = JSON.parse(JSON.stringify(currentDoc));
    const conflictDocs = [];

    if (!currentDoc.modifiedFields) {
      currentDoc.modifiedFields = {};
    }
    if (err) {
      callback(err);
    } else if (body.length) {
      for (i = 0; i < body.length; i++) {
        compareObj = body[i].ok;
        conflictDocs.push(compareObj);
        if (compareObj.modifiedFields) {
          for (key in compareObj.modifiedFields) {
            if (currentDoc[key] !== compareObj[key]) {
              updateProperty = false;
              modifiedDate = new Date(compareObj.modifiedFields[key]);
              if (currentDoc.modifiedFields[key]) {
                currentModifiedDate = new Date(currentDoc.modifiedFields[key]);
                if (modifiedDate.getTime() > currentModifiedDate.getTime()) {
                  updateProperty = true;
                }
              } else {
                updateProperty = true;
              }
            }
            if (updateProperty) {
              updateDocument = true;
              currentDoc.modifiedFields[key] = modifiedDate;
              currentDoc[key] = compareObj[key];
            }
          }
        }
      }

      if (updateDocument) {
        const resolvedConflict = {
          _id: `resolvedConflict_2_${uuid.v4()}`,
          data: {
            original: originalDoc,
            conflicts: conflictDocs
          }
        };
        maindb.insert(resolvedConflict, (err) => {
          if (err) {
            callback(`Error saving resolved conflicts: ${JSON.stringify(err)}`);
          } else {
            delete currentDoc._conflicts;
            maindb.insert(currentDoc, currentDoc._id, (err, response) => {
              if (!err && response.ok) {
                internals._cleanupConflicts(currentDoc, conflicts, callback);
              } else {
                if (!err) {
                  err = response;
                }
                callback(`Error updating latest doc with merged data: ${JSON.stringify(err)}`);
              }
            });
          }
        });
      } else {
        internals._cleanupConflicts(currentDoc, conflicts, callback);
      }
    }
  });
};

internals._cleanupConflicts = (currentDoc, conflicts, callback) => {
  const { maindb } = dbService.getDBs();
  const recordsToDelete = [];
  for (let i = 0; i < conflicts.length; i++) {
    const recordToDelete = {
      _id: currentDoc._id,
      _rev: conflicts[i],
      _deleted: true
    };
    recordsToDelete.push(recordToDelete);
  }
  if (recordsToDelete.length > 0) {
    maindb.bulk({ docs: recordsToDelete }, (err, response) => {
      if (err) {
        callback(`Error deleting conflicting revs: ${JSON.stringify(err, null, 2)}`);
      } else {
        callback(err, response);
      }
    });
  }
};

module.exports = internals;
