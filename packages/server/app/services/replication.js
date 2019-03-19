const config = require('config');

const { localDB, remoteDB } = config;
const remoteUrl = `http://${remoteDB.username}:${remoteDB.password}@${remoteDB.host}:${remoteDB.port}`;
const localAuthHeader = Buffer.from(`${localDB.username}:${localDB.password}`).toString('base64');
const remoteAuthHeader = Buffer.from(`${remoteDB.username}:${remoteDB.password}`).toString('base64');
const localDBCredentials = {
  headers: {
    Authorization: `Basic ${localAuthHeader}`,
  },
  url: `http://127.0.0.1:${localDB.port}/main`,
};
const remoteDBCredentials = {
  headers: {
    Authorization: `Basic ${remoteAuthHeader}`,
  },
  url: `http://${remoteDB.host}:${remoteDB.port}/main`,
};

const internals = {
  process: null,
  replicatorDB: {},
  replicationDocs: [{
    name: 'main-to-remote-replicate',
    doc: {
      _id: 'main-to-remote-replicate',
      source: localDBCredentials,
      target: remoteDBCredentials,
      create_target: false,
      continuous: true,
      owner: localDB.username,
    },
  }, {
    name: 'remote-to-main-replicate',
    doc: {
      _id: 'remote-to-main-replicate',
      source: remoteDBCredentials,
      target: localDBCredentials,
      create_target: false,
      continuous: true,
      owner: localDB.username,
    },
  }],
};

internals.setup = ({ PouchDB }) => {
  internals.process = PouchDB.sync('main', `${remoteUrl}/main`, {
    live: true,
    retry: true,
  })
    .on('change', (info) => {
      console.log(`DB Sync[change]: ${info.docs.length} docs`);
    })
    .on('paused', (err) => {
      console.log('DB Sync[paused]:', err);
    })
    .on('active', () => {
      console.log('DB Sync[active]');
    })
    .on('denied', (err) => {
      console.log('DB Sync[denied]:', err);
    })
    .on('complete', (info) => {
      console.log('DB Sync[complete]:', info);
    })
    .on('error', (err) => {
      console.log('DB Sync[error]:', err);
    });
};

module.exports = internals;
