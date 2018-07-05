const Promise = require('bluebird');
const nano = require('nano');
const { to } = require('await-to-js');
const config = require('config');

const couchUrl = `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`;
const internals = {
  replicatorDB: Promise.promisifyAll(nano(`${couchUrl}/_replicator`)),
  docName: 'main-to-remote-replicate',
  replicationDoc: {
    source: {
      headers: {
        Authorization: 'Basic Y291Y2hhZG1pbjp0ZXN0'
      },
      url: 'http://127.0.0.1:5984/main'
    },
    target: {
      headers: {},
      url: `${config.mainServer}/main`
    },
    create_target: false,
    continuous: true,
    owner: 'couchadmin'
  }
};

internals.setup = () => {
  return new Promise(async (resiolve, reject) => {
    let [err, doc] = await to(internals.replicatorDB.getAsync(internals.docName));
    if (err && err.statusCode === 404) [err, doc] = await to(internals.replicatorDB.insertAsync(internals.replicationDoc, internals.docName));
    if (err) return reject(err);

    console.log('Replicator setup!');
    return resiolve();
  });
};

module.exports = internals;
