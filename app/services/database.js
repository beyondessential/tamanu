const config = require('../../config');
const Promise = require('bluebird');
const { to } = require('await-to-js');
const createIndex = require('../utils/createIndex');
const createViews = require('../utils/createViews');

const dbUrl = `http://${config.localDB.username}:${config.localDB.password}@${config.localDB.host}:${config.localDB.port}`;
const nano = require('nano')(dbUrl);

Promise.promisifyAll(nano.db);
const internals = { nano };

// internals._createDB = async (dbName) => {
//   return new Promise(async (resolve, reject) => {
//     let [err, database] = await to(nano.db.get(dbName));
//     if (err && err.error === 'not_found') [err, database] = await to(nano.db.create(dbName));
//     if (err) return reject(err);
//     console.log('_database_', database);
//     return resolve(database);
//   });
// };

internals.setup = async ({ PouchDB }) => {
  // Setup databases
  const mainDB = new PouchDB('main');
  // await internals._createDB('main');
  // await internals._createDB('users');
  // await internals._createDB('config');
  console.log('Database setup!');

  // Generate index & views
  // const { mainDB } = internals.getDBs();
  createIndex(mainDB);
  createViews(mainDB);
};

internals.getDBs = () => {
  const mainDB = nano.use('main');
  const usersDB = nano.use('users');
  const configDB = nano.use('config');
  Promise.promisifyAll(mainDB);
  Promise.promisifyAll(usersDB);
  Promise.promisifyAll(configDB);

  return { mainDB, usersDB, configDB };
};

module.exports = internals;
