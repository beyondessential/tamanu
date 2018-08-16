const config = require('config');
const Promise = require('bluebird');
const faye = require('faye');
const { to } = require('await-to-js');
const util = require('util');
const dbService = require('../services/database');

const { nano } = dbService;
const { localDB, remoteDB } = config;
const localAuthHeader = Buffer.from(`${localDB.username}:${localDB.password}`).toString('base64');
const remoteAuthHeader = Buffer.from(`${remoteDB.username}:${remoteDB.password}`).toString('base64');
const localDBCredentials = {
  headers: {
    Authorization: `Basic ${localAuthHeader}`
  },
  url: `http://127.0.0.1:${localDB.port}/main`
};
const remoteDBCredentials = {
  headers: {
    Authorization: `Basic ${remoteAuthHeader}`
  },
  url: `http://${remoteDB.host}:${remoteDB.port}/main`
};

const internals = {
  replicatorDB: Promise.promisifyAll(nano.use('_replicator')),
  replicationDocs: [{
    name: 'main-to-remote-replicate',
    doc: {
      source: localDBCredentials,
      target: remoteDBCredentials,
      create_target: false,
      continuous: true,
      owner: localDB.username
    }
  }, {
    name: 'remote-to-main-replicate',
    doc: {
      source: remoteDBCredentials,
      target: localDBCredentials,
      create_target: false,
      continuous: true,
      owner: localDB.username
    }
  }]
};

internals.setup = () => {
  return new Promise(async (resolve, reject) => {
    const tasks = [];
    internals.replicationDocs.forEach((docInfo) => {
      tasks.push(internals._addReplicationDoc(docInfo));
    });

    try {
      await Promise.all(tasks);
      // internals.setupSubscriptions();
      console.log('Replicator setup!');
      return resolve();
    } catch (err) {
      return reject(err);
    }
  });
};

// internals.setupSubscriptions = async () => {
//   const client = new faye.Client(config.couchPubSubUrl);

//   client.subscribe('/couchDBChange', async (msg) => {
//     const [err, res] = await to(nano.localDB.replicateAsync(`${config.mainCouchServer}/main`, 'main'));
//     if (err) throw new Error(err);
//     console.log('couch-change-res', res);
//     console.log('couch-change-detected', msg);
//   });
// };

internals._addReplicationDoc = (docInfo) => {
  return new Promise(async (resolve, reject) => {
    let [err, doc] = await to(internals.replicatorDB.getAsync(docInfo.name));
    if (err && err.statusCode === 404) [err, doc] = await to(internals.replicatorDB.insertAsync(docInfo.doc, docInfo.name));
    if (err) return reject(err);
    return resolve(doc);
  });
};

module.exports = internals;
