const config = require('config');
const Promise = require('bluebird');
const faye = require('faye');
const { to } = require('await-to-js');
const dbService = require('../services/database');

const { nano } = dbService;
const internals = {
  replicatorDB: Promise.promisifyAll(nano.use('_replicator')),
  replicationDocs: [
    {
      name: 'main-to-remote-replicate',
      doc: {
        source: {
          headers: {
            Authorization: 'Basic Y291Y2hhZG1pbjp0ZXN0'
          },
          url: 'http://127.0.0.1:5984/main'
        },
        target: {
          headers: {},
          url: `${config.mainCouchServer}/main`
        },
        create_target: false,
        continuous: true,
        owner: 'couchadmin'
      }
    },
    {
      name: 'remote-to-main-replicate',
      doc: {
        source: {
          headers: {},
          url: `${config.mainCouchServer}/main`
        },
        target: {
          headers: {
            Authorization: 'Basic Y291Y2hhZG1pbjp0ZXN0'
          },
          url: 'http://127.0.0.1:5984/main'
        },
        create_target: false,
        continuous: true,
        owner: 'couchadmin',
      }
    }
  ]
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

internals.setupSubscriptions = async () => {
  const client = new faye.Client(config.couchPubSubUrl);

  client.subscribe('/couchDBChange', async (msg) => {
    const [err, res] = await to(nano.db.replicateAsync(`${config.mainCouchServer}/main`, 'main'));
    if (err) throw new Error(err);
    console.log('couch-change-res', res);
    console.log('couch-change-detected', msg);
  });
};

internals._addReplicationDoc = (docInfo) => {
  return new Promise(async (resolve, reject) => {
    let [err, doc] = await to(internals.replicatorDB.getAsync(docInfo.name));
    if (err && err.statusCode === 404) [err, doc] = await to(internals.replicatorDB.insertAsync(docInfo.doc, docInfo.name));
    if (err) return reject(err);
    return resolve(doc);
  });
};

module.exports = internals;
