const config = require('config');
const Promise = require('bluebird');
const { to } = require('await-to-js');

const dbUrl = `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`;
const nano = require('nano')(dbUrl);

Promise.promisifyAll(nano.db);
const internals = { nano };

internals._createDB = async (dbName) => {
  return new Promise(async (resolve, reject) => {
    let [err, database] = await to(nano.db.getAsync(dbName));
    if (err && err.error === 'not_found') [err, database] = await to(nano.db.createAsync(dbName));
    if (err) return reject(err);
    return resolve(database);
  });
};

internals.setup = () => {
  return new Promise(async (resolve, reject) => {
    let [err] = await to(internals._createDB('main'));
    if (!err) [err] = await to(internals._createDB('users'));
    if (err) return reject(err);
    console.log('Database setup!');

    // Create indexes
    // await internals.createIndexes();
    return resolve();
  });
};

internals.createIndexes = async () => {
  return new Promise(async (resolve, reject) => {
    const indexDef = {
      index: { fields: ['clientId'] },
      name: 'clientId'
    };
    const { pushDB } = internals.getDBs();
    const [err, res] = await to(pushDB.createIndexAsync(indexDef));
    console.log('Database indexes added!');
    if (err) return reject(err);
    return resolve(res);
  });
};

internals.getDBs = () => {
  const mainDB = nano.use('main');
  const usersDB = nano.use('users');
  Promise.promisifyAll(mainDB);
  Promise.promisifyAll(usersDB);

  return { mainDB, usersDB };
};

module.exports = internals;
