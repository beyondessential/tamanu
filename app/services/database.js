const config = require('config');
const Promise = require('bluebird');
const { to } = require('await-to-js');

const dbUrl = `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`;
const nano = require('nano')(dbUrl);

Promise.promisifyAll(nano.db);
const internals = {};

internals.createDBs = () => {
  return new Promise(async (resolve, reject) => {
    let [err, pushDB] = await to(nano.db.getAsync('pushinfo'));
    if (err && err.error === 'not_found') [err, pushDB] = await to(nano.db.createAsync('pushinfo'));
    if (err) return reject(err);
    console.log('Database pushinfo added!');

    // Create indexes
    await internals.createIndexes();
    return resolve(pushDB);
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
  const pushDB = nano.use('pushinfo');
  Promise.promisifyAll(pushDB);
  return { pushDB };
};

module.exports = internals;
